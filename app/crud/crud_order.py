# ARQUIVO ATUALIZADO: app/crud/crud_order.py

from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import and_, desc
from .base import CRUDBase
from .. import models, schemas

# Note: Como Order não tem Update schema por enquanto, usamos OrderCreate ou BaseModel no Generic
class CRUDOrder(CRUDBase[models.Order, schemas.OrderCreate, schemas.OrderCreate]):
    
    def get_multi_filtered(
        self, 
        db: Session, 
        *, 
        filter_params: schemas.OrderFilter,
        skip: int = 0, 
        limit: int = 100
    ) -> List[models.Order]:
        """
        Busca avançada para o Backoffice (Admin).
        Permite filtrar por status, cliente, data, etc.
        """
        query = db.query(self.model)

        # Joins necessários para filtros (ex: email do usuário)
        if filter_params.user_email:
            query = query.join(models.User).filter(models.User.email.ilike(f"%{filter_params.user_email}%"))

        # Filtros diretos
        if filter_params.status:
            query = query.filter(self.model.status == filter_params.status)
        
        if filter_params.payment_status:
            query = query.filter(self.model.payment_status == filter_params.payment_status)
            
        if filter_params.date_start:
            query = query.filter(self.model.created_at >= filter_params.date_start)
            
        if filter_params.date_end:
            query = query.filter(self.model.created_at <= filter_params.date_end)

        # Ordenação e Eager Loading (Trazer itens e dono junto)
        return (
            query
            .options(
                joinedload(self.model.items).joinedload(models.OrderItem.product),
                joinedload(self.model.owner)
            )
            .order_by(desc(self.model.created_at)) # Mais recentes primeiro
            .offset(skip)
            .limit(limit)
            .all()
        )

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