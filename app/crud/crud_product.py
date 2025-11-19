# ARQUIVO ATUALIZADO: app/crud/crud_product.py

from sqlalchemy.orm import Session
from typing import List, Optional

from .base import CRUDBase
from .. import models, schemas

class CRUDProduct(CRUDBase[models.Product, schemas.ProductCreate, schemas.ProductUpdate]):
    
    def get_by_barcode(self, db: Session, *, barcode: str) -> Optional[models.Product]:
        if not barcode:
            return None
        return db.query(self.model).filter(self.model.barcode == barcode).first()

    def get_for_update(self, db: Session, product_id: int) -> Optional[models.Product]:
        """
        Busca um produto aplicando um lock pessimista (SELECT ... FOR UPDATE).
        Vital para evitar 'race conditions' no checkout.
        """
        return (
            db.query(self.model)
            .filter(self.model.id == product_id)
            .with_for_update()
            .first()
        )

    def update_stock(
        self, 
        db: Session, 
        *, 
        db_product: models.Product, 
        change_in_stock: int = 0, 
        change_in_loan: int = 0
    ) -> models.Product:
        """
        Atualiza atomicamente o estoque físico e a quantidade consignada.
        NÃO faz commit para permitir transações maiores no Service.
        """
        db_product.stock_quantity += change_in_stock
        db_product.on_loan_quantity += change_in_loan
        db.add(db_product)
        return db_product

    def decrease_stock(self, db: Session, *, product: models.Product, quantity: int) -> models.Product:
        """
        Helper simples para baixar estoque em vendas diretas.
        """
        product.stock_quantity -= quantity
        db.add(product)
        return product

# Instância exportada para ser usada nos Routers e Services
product = CRUDProduct(models.Product)