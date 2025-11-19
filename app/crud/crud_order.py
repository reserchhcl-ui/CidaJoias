# ARQUIVO ATUALIZADO: app/crud/crud_order.py

from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from typing import List

from .base import CRUDBase
from .. import models, schemas

# Note: Como Order não tem Update schema por enquanto, usamos OrderCreate ou BaseModel no Generic
class CRUDOrder(CRUDBase[models.Order, schemas.OrderCreate, schemas.OrderCreate]):
    
    def create_order_in_db(self, db: Session, *, user: models.User, order_create: schemas.OrderCreate) -> models.Order:
        """
        Esta função antiga era usada diretamente pelo Router simples.
        Mantemos para compatibilidade, mas agora encapsulada.
        """
        # A lógica complexa deve ficar no Service, mas aqui é a persistência bruta
        db_order = models.Order(user_id=user.id, status="created")
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    def create_order(self, db: Session, *, user_id: int, status: str) -> models.Order:
        """
        Cria a entidade Order no banco (usado pelo OrderService).
        ATENÇÃO: Usa flush() em vez de commit() para manter a transação aberta.
        """
        db_order = models.Order(user_id=user_id, status=status)
        db.add(db_order)
        db.flush()  # Garante que db_order.id esteja disponível para os itens
        return db_order

    def create_order_item(
        self, 
        db: Session, 
        *, 
        order_id: int, 
        product_id: int, 
        quantity: int, 
        price_at_purchase: Decimal
    ) -> models.OrderItem:
        """
        Cria um item de pedido. Não faz commit.
        """
        db_item = models.OrderItem(
            order_id=order_id,
            product_id=product_id,
            quantity=quantity,
            price_at_purchase=price_at_purchase
        )
        db.add(db_item)
        return db_item

    def get_orders_by_customer(
        self, 
        db: Session, 
        *, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[models.Order]:
        """
        Busca o histórico de pedidos de um cliente com Eager Loading (joinedload)
        para trazer os itens e produtos numa única query.
        """
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(self.model.id.desc())
            .options(
                joinedload(models.Order.items)
                .joinedload(models.OrderItem.product)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    # Alias para manter compatibilidade se algum router chamar 'get_by_user'
    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 25):
        return self.get_orders_by_customer(db, user_id=user_id, skip=skip, limit=limit)

# Instância exportada
order = CRUDOrder(models.Order)