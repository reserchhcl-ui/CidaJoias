# NOVO ARQUIVO: app/crud/crud_discount.py

from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime

from .base import CRUDBase
from .. import models, schemas

class CRUDDiscount(CRUDBase[models.Discount, schemas.DiscountCreate, schemas.DiscountUpdate]): # Schemas a serem criados
    def get_active_for_product(self, db: Session, *, product_id: int) -> models.Discount | None:
        """
        Busca por um desconto ATIVO para um determinado produto.
        Um desconto é ativo se a data atual está entre start_time e end_time.
        """
        now = datetime.utcnow()
        return (
            db.query(self.model)
            .filter(
                and_(
                    self.model.product_id == product_id,
                    self.model.start_time <= now,
                    self.model.end_time >= now,
                )
            )
            .order_by(self.model.discount_price.asc()) # Em caso de múltiplos, pega o mais barato
            .first()
        )

discount = CRUDDiscount(models.Discount)