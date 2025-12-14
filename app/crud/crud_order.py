# ARQUIVO ATUALIZADO: app/crud/crud_order.py

from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import and_, desc,or_
from .base import CRUDBase
from .. import models, schemas

# Note: Como Order não tem Update schema por enquanto, usamos OrderCreate ou BaseModel no Generic
class CRUDOrder(CRUDBase[models.Order, schemas.OrderCreate, schemas.OrderCreate]):
    
    def get_multi_filtered(
            self, 
            db: Session, 
            *, 
            filters: schemas.OrderFilter, 
            skip: int = 0, 
            limit: int = 50
        ) -> List[models.Order]:
            """
            Busca Admin: Filtra por tudo e traz dados completos (User + Address + Items + Products)
            """
            query = db.query(self.model)

            # 1. Joins para permitir busca por dados do Usuário
            query = query.join(models.User)

            # 2. Aplicação dos Filtros
            if filters.order_id:
                query = query.filter(self.model.id == filters.order_id)
                
            if filters.search_term:
                term = f"%{filters.search_term}%"
                # Busca por Nome do Cliente OU Email do Cliente
                query = query.filter(
                    or_(
                        models.User.name.ilike(term),
                        models.User.email.ilike(term)
                    )
                )

            if filters.status:
                query = query.filter(self.model.status == filters.status)
                
            if filters.payment_status:
                query = query.filter(self.model.payment_status == filters.payment_status)

            if filters.date_start:
                query = query.filter(self.model.created_at >= filters.date_start)
                
            if filters.date_end:
                query = query.filter(self.model.created_at <= filters.date_end)

            # 3. Eager Loading (Trazer tudo numa query só para performance)
            return (
                query
                .options(
                    joinedload(self.model.items).joinedload(models.OrderItem.product), # Traz itens e produtos
                    joinedload(self.model.shipping_address), # Traz endereço
                    joinedload(self.model.owner) # Traz dados do Cliente (NOVO)
                )
                .order_by(self.model.created_at.desc()) # Mais recentes primeiro
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
        db_order = models.Order(user_id=user.id, status="pending")
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

    def get_orders_by_customer(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Order]:
        """
        Busca pedidos trazendo: Itens, Produto dos Itens e Endereço de Entrega.
        """
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .options(
                # Carrega os itens e, dentro deles, o produto
                joinedload(self.model.items).joinedload(models.OrderItem.product),
                # Carrega o endereço de entrega
                joinedload(self.model.shipping_address)
            )
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # Precisamos atualizar o GET unitário também (usado em /orders/{id})
    def get(self, db: Session, id: int):
        return (
            db.query(self.model)
            .filter(self.model.id == id)
            .options(
                joinedload(self.model.items).joinedload(models.OrderItem.product),
                joinedload(self.model.shipping_address)
            )
            .first()
        )
    
    # Alias para manter compatibilidade se algum router chamar 'get_by_user'
    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 25):
        return self.get_orders_by_customer(db, user_id=user_id, skip=skip, limit=limit)

# Instância exportada
order = CRUDOrder(models.Order)