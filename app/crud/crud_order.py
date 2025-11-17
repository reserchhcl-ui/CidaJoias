from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from decimal import Decimal

def create_order(db: Session, *, user_id: int, status: str) -> models.Order:
    """
    Cria a entidade Order no banco. Não faz commit.
    """
    db_order = models.Order(user_id=user_id, status=status)
    db.add(db_order)
    db.flush()  # Garante que db_order.id esteja disponível para os itens
    return db_order

def create_order_item(db: Session, *, order_id: int, product_id: int, quantity: int, price_at_purchase: Decimal) -> models.OrderItem:
    """
    Cria a entidade OrderItem no banco. Não faz commit.
    """
    db_item = models.OrderItem(
        order_id=order_id,
        product_id=product_id,
        quantity=quantity,
        price_at_purchase=price_at_purchase
    )
    db.add(db_item)
    return db_item

def get_orders_by_customer(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[models.Order]:
    """
    Busca o histórico de pedidos de um cliente de forma otimizada.
    """
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == user_id)
        .order_by(models.Order.id.desc())
        .options(
            joinedload(models.Order.items)
            .joinedload(models.OrderItem.product)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_orders_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 25):
    """
    Busca uma lista paginada de encomendas para um utilizador específico.
    Usa 'joinedload' para carregar os itens da encomenda de forma eficiente
    e evitar o problema N+1.
    """
    return (
        db.query(models.Order)
        .filter(models.Order.user_id == user_id) # Filtro de segurança crucial
        .order_by(models.Order.id.desc())         # Encomendas mais recentes primeiro
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product)) # Carregamento eficiente
        .offset(skip)
        .limit(limit)
        .all()
    )
