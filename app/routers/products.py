# ARQUIVO: app/routers/products.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..services.pricing_engine import PricingEngine
from .. import models, schemas, auth, crud
from ..database import get_db

# CORREÇÃO 1: Prefixo simples. O 'api/v1' vem do main.py
router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

def get_pricing_engine(db: Session = Depends(get_db)):
    return PricingEngine(db=db)

# --- LEITURA (GET) - PÚBLICO ---

@router.get("/", response_model=List[schemas.Product])
def read_products(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    # 1. Busca produtos "crus" do banco
    products_from_db = crud.product.get_multi(db, skip=skip, limit=limit)
    
    # 2. Calcula preços em lote
    current_prices = pricing_engine.get_current_prices_for_products(products=products_from_db)
    
    results = []
    for product in products_from_db:
        # CORREÇÃO 2: Criamos um dict explicitamente para injetar o 'current_price'
        # Isso satisfaz o Schema do Pydantic que exige esse campo.
        p_data = {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "selling_price": product.selling_price,
            "cost_price": product.cost_price,
            "stock_quantity": product.stock_quantity,
            "on_loan_quantity": product.on_loan_quantity,
            "barcode": product.barcode,
            "image_url": product.image_url,
            "current_price": current_prices.get(product.id, product.selling_price)
        }
        results.append(p_data)
    return results

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(
    product_id: int, 
    db: Session = Depends(get_db)
):
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    pricing_engine = PricingEngine(db)
    current_price = pricing_engine.get_current_price_for_product(product=db_product)
    
    # Conversão manual para garantir a injeção do campo extra
    p_data = db_product.__dict__.copy()
    p_data["current_price"] = current_price
    return p_data

@router.get("/barcode/{barcode}", response_model=schemas.Product)
def read_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    # Mantemos admin aqui se desejar, ou removemos para deixar público
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    db_product = crud.product.get_by_barcode(db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    pricing_engine = PricingEngine(db)
    p_data = db_product.__dict__.copy()
    p_data["current_price"] = pricing_engine.get_current_price_for_product(product=db_product)
    return p_data

# --- ESCRITA (POST/PUT/DELETE) - ADMIN ONLY ---

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product_endpoint(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    if crud.product.get_by_barcode(db, barcode=product.barcode):
        raise HTTPException(status_code=400, detail="Barcode already registered")
    
    new_product = crud.product.create(db=db, product=product)
    
    # Ao criar, o preço atual é igual ao de venda
    p_data = new_product.__dict__.copy()
    p_data["current_price"] = new_product.selling_price
    p_data["id"] = new_product.id
    return p_data

@router.put("/{product_id}", response_model=schemas.Product)
def update_product_endpoint(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = crud.product.update(db=db, db_product=db_product, product_update=product_update)
    
    pricing_engine = PricingEngine(db)
    p_data = updated_product.__dict__.copy()
    p_data["current_price"] = pricing_engine.get_current_price_for_product(product=updated_product)
    return p_data

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_endpoint(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    crud.product.remove(db=db, db_product=db_product)
    return None