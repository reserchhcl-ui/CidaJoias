# ARQUIVO REFATORADO: tests/utils/product.py

from sqlalchemy.orm import Session
from faker import Faker
from decimal import Decimal
from datetime import datetime, timedelta, timezone

# Importamos as instâncias específicas do CRUD
from app import crud
from app.models import Product, Discount
from app.schemas import ProductCreate, DiscountCreate

fake = Faker()

def create_random_product(
    db: Session,
    *,
    cost_price: float = None,
    selling_price: float = None,
    stock_quantity: int = None
) -> Product:
    """
    Cria um produto aleatório para testes.
    """
    # Lógica de preços (garantindo Decimal para evitar erros de float)
    if cost_price is None:
        cost_price = Decimal(fake.random_int(min=10, max=100))
    else:
        cost_price = Decimal(str(cost_price))
    
    if selling_price is None:
        # Margem de lucro aleatória entre 50% e 100%
        markup = Decimal(fake.random_int(min=150, max=200)) / 100
        selling_price = cost_price * markup
    else:
        selling_price = Decimal(str(selling_price))

    if stock_quantity is None:
        stock_quantity = fake.random_int(min=10, max=100)
        
    product_in = ProductCreate(
        name=f"Produto {fake.word().capitalize()}",
        description=fake.sentence(),
        cost_price=cost_price,
        selling_price=selling_price,
        stock_quantity=stock_quantity,
        barcode=fake.ean(length=13),
        image_url=fake.image_url()
    )
    
    # Chamada corrigida: usa crud.product (instância) e método .create (da CRUDBase)
    return crud.product.create(db=db, obj_in=product_in)

def create_discount_for_product(
    db: Session,
    *,
    product_id: int,
    discount_price: float,
    days_valid: int = 7
) -> Discount:
    """
    Cria um desconto ativo.
    """
    # CORREÇÃO: datetime.now(timezone.utc) é o padrão moderno
    end_time = datetime.now(timezone.utc) + timedelta(days=days_valid)
    
    discount_in = DiscountCreate(
        product_id=product_id,
        discount_price=Decimal(str(discount_price)),
        end_time=end_time,
        # O start_time é default=now no model, então não precisamos passar se quisermos que comece já
    )
    
    # Chamada corrigida: usa crud.discount
    return crud.discount.create(db=db, obj_in=discount_in)