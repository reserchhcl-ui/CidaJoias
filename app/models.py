from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

# Importamos a Base do nosso arquivo database.py
from .database import Base

# Vamos modelar apenas o Produto por enquanto, para focar no endpoint
class Product(Base):
    __tablename__ = "products"

    # Nossas colunas da tabela, agora como atributos da classe
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String)
    
    # IMPORTANTE: Usamos DECIMAL para dinheiro, mas o driver o trata como Float no Python
    # Vamos usar Float aqui por simplicidade na API, mas no banco é DECIMAL
    price = Column(DECIMAL(10, 2), nullable=False) 
    
    stock_quantity = Column(Integer, nullable=False, default=0)
    barcode = Column(String(100), unique=True, index=True)
    image_url = Column(String(1024))
    items = relationship("OrderItem", back_populates="product")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_admin = Column(Boolean, default=False)
    
    # Relação: Um usuário pode ter muitos pedidos
    orders = relationship("Order", back_populates="owner")

# --- Adicione também as outras classes para completarmos o modelo ---

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    # created_at (o SQL já define o default, não precisamos no SQLAlchemy)
    
    # Relações
    owner = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(DECIMAL(10, 2), nullable=False)

    # Relações
    order = relationship("Order", back_populates="items")
    product = relationship("Product") # Relação simples, 'product' não precisa saber sobre 'items'

