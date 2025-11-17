# ARQUIVO CORRIGIDO E COMPLETO: tests/utils/product.py

from sqlalchemy.orm import Session
from faker import Faker
from decimal import Decimal
from datetime import datetime, timedelta

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
    Cria um produto com dados aleatórios ou especificados no banco de dados de teste.
    Retorna o objeto do modelo SQLAlchemy do produto criado.

    :param db: A sessão do banco de dados de teste.
    :param cost_price: Preço de custo customizável para o teste.
    :param selling_price: Preço de venda customizável para o teste.
    :param stock_quantity: Quantidade em estoque customizável para o teste.
    """
    # Se o preço de custo não for fornecido, gera um aleatório
    if cost_price is None:
        cost_price = round(fake.pydecimal(left_digits=2, right_digits=2, positive=True, min_value=10), 2)
    else:
        cost_price = Decimal(str(cost_price))
    
    # Se o preço de venda não for fornecido, gera um com base no custo para garantir lucro
    if selling_price is None:
        selling_price = cost_price * Decimal(fake.pyfloat(min_value=1.5, max_value=3.0, right_digits=2))
    else:
        selling_price = Decimal(str(selling_price))

    # Se o estoque não for fornecido, gera um aleatório
    if stock_quantity is None:
        stock_quantity = fake.random_int(min=10, max=100)
        
    product_in = ProductCreate(
        name=fake.ecommerce_name(),
        description=fake.sentence(),
        cost_price=cost_price,
        selling_price=selling_price,
        stock_quantity=stock_quantity,
        barcode=fake.ean(length=13)
    )
    # Usa o CRUD da aplicação para criar o produto no banco
    return crud.product.create(db=db, obj_in=product_in)

def create_discount_for_product(
    db: Session,
    *,
    product_id: int,
    discount_price: float,
    days_valid: int = 7
) -> Discount:
    """
    Cria um desconto ATIVO para um produto específico no banco de dados de teste.
    Esta função é uma dependência crucial para testar o pricing_engine.
    Retorna o objeto do modelo SQLAlchemy do desconto criado.

    :param db: A sessão do banco de dados de teste.
    :param product_id: O ID do produto para o qual o desconto se aplica.
    :param discount_price: O preço promocional.
    :param days_valid: Por quantos dias o desconto será válido a partir de agora.
    """
    # Define a data de término do desconto no futuro para garantir que ele esteja ativo
    end_time = datetime.utcnow() + timedelta(days=days_valid)
    
    discount_in = DiscountCreate(
        product_id=product_id,
        discount_price=Decimal(str(discount_price)),
        end_time=end_time
    )
    # Usa o CRUD da aplicação para criar o desconto no banco
    return crud.discount.create(db=db, obj_in=discount_in)