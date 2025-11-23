# NOVO ARQUIVO: app/routers/recommendations.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List,Any

from .. import models, schemas, auth
from ..database import get_db
from ..services.recommendation_engine import RecommendationEngine
from ..services.pricing_engine import PricingEngine

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations (ML)"]
)

# Helpers para injeção de dependência
def get_recommendation_engine(db: Session = Depends(get_db)) -> RecommendationEngine:
    return RecommendationEngine(db)

def get_pricing_engine(db: Session = Depends(get_db)) -> PricingEngine:
    return PricingEngine(db)

@router.get("/", response_model=List[schemas.Product])
def get_personalized_recommendations(
    limit: int = 5,
    db: Session = Depends(get_db),
    # Exige utilizador logado (Cliente)
    current_user: models.User = Depends(auth.require_customer_user),
    rec_engine: RecommendationEngine = Depends(get_recommendation_engine),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Retorna uma lista de produtos recomendados para o utilizador logado.
    """
    products = rec_engine.get_recommendations_for_user(user_id=current_user.id, limit=limit)
    
    # Injeção do campo calculado 'current_price'
    results = []
    for product in products:
        # Convertemos o objeto SQLAlchemy para dict para poder adicionar campos extras
        p_data = product.__dict__.copy()
        p_data["current_price"] = pricing_engine.get_current_price_for_product(product=product)
        results.append(p_data)
        
    return results

@router.get("/product/{product_id}", response_model=List[schemas.Product])
def get_similar_products(
    product_id: int,
    limit: int = 4,
    db: Session = Depends(get_db),
    rec_engine: RecommendationEngine = Depends(get_recommendation_engine),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Retorna produtos similares (ex: mesmo range de preço).
    Acesso público (não requer login).
    """
    products = rec_engine.get_similar_products(product_id=product_id, limit=limit)
    
    results = []
    for product in products:
        p_data = product.__dict__.copy()
        p_data["current_price"] = pricing_engine.get_current_price_for_product(product=product)
        results.append(p_data)
        
    return results

@router.get("/trending", response_model=List[schemas.Product])
def get_trending_recommendations(
    limit: int = 4,
    db: Session = Depends(get_db),
    rec_engine: RecommendationEngine = Depends(get_recommendation_engine),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
) -> Any:
    """
    Retorna produtos 'Trending' enriquecidos com o preço atual (descontos aplicados).
    """
    # 1. ML: Seleciona OS PRODUTOS
    recommended_products = rec_engine.get_trending_products(limit=limit)
    
    if not recommended_products:
        return []

    # 2. Pricing: Calcula OS PREÇOS
    # Busca preços em lote para performance
    current_prices = pricing_engine.get_current_prices_for_products(products=recommended_products)
    
    # 3. Montagem: Cria a resposta combinando Dados do Produto + Preço Calculado
    results = []
    for product in recommended_products:
        # Convertemos o modelo SQLAlchemy para dict para poder injetar o campo extra
        p_data = product.__dict__.copy()
        
        # Injetamos 'current_price' que o schema Pydantic exige
        p_data["current_price"] = current_prices.get(product.id, product.selling_price)
        
        results.append(p_data)
        
    return results