# app/crud/crud_product.py

from sqlalchemy.orm import Session
from .. import models, schemas

# Cada função agora é super focada em uma única operação de DB.

def get_product(db: Session, product_id: int) -> models.Product | None:
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_barcode(db: Session, barcode: str) -> models.Product | None:
    if not barcode:
        return None
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()

def get_products(db: Session, skip: int = 0, limit: int = 100) -> list[models.Product]:
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, db_product: models.Product, product_update: schemas.ProductUpdate) -> models.Product:
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, db_product: models.Product):
    db.delete(db_product)
    db.commit()
    
# --- Novas funções CRUD atômicas que serão usadas pelos serviços ---

def get_product_for_update(db: Session, product_id: int) -> models.Product | None:
    """Busca um produto aplicando um lock pessimista na linha para evitar race conditions."""
    return db.query(models.Product).filter(models.Product.id == product_id).with_for_update().first()

def decrease_stock(db: Session, *, product: models.Product, quantity: int) -> models.Product:
    """Diminui o estoque físico de um produto. Não faz commit."""
    product.stock_quantity -= quantity
    db.add(product)
    return product