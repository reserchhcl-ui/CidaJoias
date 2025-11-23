# app/crud/crud_coupon.py

from typing import Optional
from sqlalchemy.orm import Session
from .base import CRUDBase
from ..models import Coupon
from ..schemas import CouponCreate, CouponUpdate

class CRUDCoupon(CRUDBase[Coupon, CouponCreate, CouponUpdate]):
    
    def get_by_code(self, db: Session, *, code: str) -> Optional[Coupon]:
        """Busca case-insensitive pelo código."""
        return db.query(self.model).filter(self.model.code == code.upper()).first()

    def increment_usage(self, db: Session, *, coupon_id: int) -> None:
        """
        Incrementa o contador de uso de forma atômica no banco de dados.
        Isso previne 'race conditions' onde dois pedidos simultâneos poderiam
        usar o último cupom disponível.
        """
        db.query(self.model).filter(self.model.id == coupon_id).update(
            {self.model.current_uses: self.model.current_uses + 1}
        )
        # O commit é deixado para o Service para manter a transação completa do pedido

coupon = CRUDCoupon(Coupon)