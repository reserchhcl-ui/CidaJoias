# app/routers/products.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Usamos '..' para importar de diretórios pais
from .. import models, schemas, auth
from ..database import get_db
from ..crud import *
# 1. Criamos um "router"
# Isto funciona como uma "mini" app FastAPI
router = APIRouter(
    prefix="/products",  # 2. Todos os endpoints aqui começarão com /products
    tags=["Products"]    # 3. Agrupa os endpoints na documentação do Swagger
)

@router.get("/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud_product.get_products(db, skip=skip, limit=limit)
    return products

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product_endpoint(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    if crud_product.get_product_by_barcode(db, barcode=product.barcode):
        raise HTTPException(status_code=400, detail="Barcode already registered")
    return crud_product.create_product(db=db, product=product)

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    db_product = crud_product.get_product(db=db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product_endpoint(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    db_product = crud_product.get_product(db=db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud_product.update_product(db=db, db_product=db_product, product_update=product_update)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_endpoint(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    db_product = crud_product.get_product(db=db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    crud_product.delete_product(db=db, db_product=db_product)
    return None

@router.get("/barcode/{barcode}", response_model=schemas.Product)
def read_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    """
    Obtém os detalhes de um produto específico pelo seu código de barras.
    Requer privilégios de administrador. Ideal para a app de gestão de stock.
    """
    db_product = crud_product.get_product_by_barcode(db, barcode=barcode)

    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product with this barcode not found"
        )
    
    return db_product