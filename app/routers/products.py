# app/routers/products.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..services.pricing_engine import PricingEngine
from .. import schemas, crud
from ..database import get_db

# Router Público
router = APIRouter(
    prefix="/products",
    tags=["Products (Store)"]
)

def get_pricing_engine(db: Session = Depends(get_db)):
    return PricingEngine(db=db)

@router.get("/", response_model=List[schemas.ProductPublic])
def read_products(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Lista produtos disponíveis para venda.
    Oculta dados sensíveis (preço de custo, fornecedor).
    """
    products_from_db = crud.product.get_multi(db, skip=skip, limit=limit)
    current_prices = pricing_engine.get_current_prices_for_products(products=products_from_db)
    
    results = []
    for product in products_from_db:
        # Monta o objeto de resposta injetando o preço calculado e a categoria
        p_data = product.__dict__.copy()
        p_data["current_price"] = current_prices.get(product.id, product.selling_price)
        
        if product.category:
            p_data["category"] = product.category
            
        results.append(p_data)
    return results

@router.get("/{product_id}", response_model=schemas.ProductPublic)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Detalhes de um produto específico para o cliente."""
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    pricing_engine = PricingEngine(db)
    current_price = pricing_engine.get_current_price_for_product(product=db_product)
    
    p_data = db_product.__dict__.copy()
    p_data["current_price"] = current_price
    return p_data

@router.post("/search", response_model=List[schemas.ProductPublic])
def search_products(
    filter_params: schemas.ProductFilter,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Busca avançada (Filtros de preço, categoria, termo).
    """
    products_from_db = crud.product.get_multi_filtered(
        db, filter_params=filter_params, skip=skip, limit=limit
    )
    current_prices = pricing_engine.get_current_prices_for_products(products=products_from_db)
    
    results = []
    for product in products_from_db:
        p_data = product.__dict__.copy()
        p_data["current_price"] = current_prices.get(product.id, product.selling_price)
        if product.category:
            p_data["category"] = product.category
        results.append(p_data)
    return results