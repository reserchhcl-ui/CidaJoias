# app/crud.py

from sqlalchemy.orm import Session,joinedload
from . import models, schemas
from .auth import get_password_hash

# --- CRUD para Users ---

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- CRUD para Products ---

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_barcode(db: Session, barcode: str):
    if not barcode:
        return None
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, db_product: models.Product, product_update: schemas.ProductUpdate):
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.add(db_product) # ou db.commit() diretamente se não houver mais nada na sessão
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, db_product: models.Product):
    db.delete(db_product)
    db.commit()

def create_order(db: Session, user: models.User, order_create: schemas.OrderCreate):
    """
    Cria uma nova encomenda, incluindo os seus itens e atualizando o stock.
    Esta função é transacional. Ou tudo funciona, ou nada é salvo.
    """
    try:
        # 1. Criar o registo principal da Encomenda (Order)
        db_order = models.Order(
            user_id=user.id,
            status="processing" # Um status inicial
        )
        db.add(db_order)
        # Usamos flush para obter o ID da encomenda antes do commit final
        db.flush()

        total_order_price = 0 # (Opcional, mas útil)

        # 2. Iterar sobre os itens do carrinho
        for item in order_create.items:
            # Obter o produto da base de dados para verificar stock e preço
            db_product = get_product(db, product_id=item.product_id)

            # 2a. Validações de negócio CRÍTICAS
            if not db_product:
                raise ValueError(f"Product with id {item.product_id} not found.")
            if db_product.stock_quantity < item.quantity:
                raise ValueError(f"Insufficient stock for product '{db_product.name}'. Available: {db_product.stock_quantity}, Requested: {item.quantity}")

            # 2b. Criar o Item da Encomenda (OrderItem)
            db_order_item = models.OrderItem(
                order_id=db_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_purchase=db_product.price # "Congelamos" o preço aqui!
            )
            db.add(db_order_item)

            # 2c. Atualizar o stock do produto
            db_product.stock_quantity -= item.quantity

        # 3. Se tudo correu bem até aqui, confirmar a transação
        db.commit()
        # Refresh para carregar as relações (como a lista de 'items')
        db.refresh(db_order)
        return db_order

    except ValueError as e:
        # 4. Se qualquer validação falhou, reverter TODAS as alterações
        db.rollback()
        # Re-levantar a exceção para que o endpoint possa tratá-la
        raise e


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

def get_product_by_barcode(db: Session, barcode: str):
    """
    Busca um único produto pelo seu código de barras.
    Aproveita o índice da base de dados para uma busca rápida.
    """
    if not barcode:
        return None
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()