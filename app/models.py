# app/models.py

import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DECIMAL, DateTime, 
    ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Importamos a Base do nosso arquivo database.py
from .database import Base

# --- NOVOS ENUMS PARA ROLES E STATUS ---

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    SALES_REP = "sales_rep" # Vendedora
    ADMIN = "admin"

class SalesCaseStatus(str, enum.Enum):
    ON_LOAN = "on_loan"
    RETURNED = "returned"
    OVERDUE = "overdue"

# --- MODELOS ATUALIZADOS E NOVOS ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # ## --- ALTERAÇÃO ---
    # Substituímos 'is_admin' por um sistema de 'roles' mais flexível.
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    
    # Relações
    orders = relationship("Order", back_populates="owner")
    # ## --- ADIÇÃO ---
    # Nova relação para os estojos de uma vendedora
    sales_cases = relationship("SalesCase", back_populates="sales_rep")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String)
    price = Column(DECIMAL(10, 2), nullable=False)
    
    # ## --- ALTERAÇÃO ---
    # Agora temos um controlo de inventário mais detalhado.
    stock_quantity = Column(Integer, nullable=False, default=0) # Stock físico total
    on_loan_quantity = Column(Integer, nullable=False, default=0) # Stock em estojos
    
    barcode = Column(String(100), unique=True, index=True)
    image_url = Column(String(1024))
    
    # Relações
    order_items = relationship("OrderItem", back_populates="product")

# --- MODELOS DE ENCOMENDA (Sem alterações, mas incluídos para o ficheiro completo) ---

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    
    owner = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(DECIMAL(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

# --- NOVOS MODELOS PARA ESTOJOS (SALES CASES) ---

class SalesCase(Base):
    __tablename__ = "sales_cases"

    id = Column(Integer, primary_key=True)
    sales_rep_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loan_date = Column(DateTime(timezone=True), server_default=func.now())
    return_by_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(SalesCaseStatus), nullable=False, default=SalesCaseStatus.ON_LOAN)

    sales_rep = relationship("User", back_populates="sales_cases")
    items = relationship("SalesCaseItem", back_populates="case", cascade="all, delete-orphan")

class SalesCaseItem(Base):
    __tablename__ = "sales_case_items"

    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("sales_cases.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)

    case = relationship("SalesCase", back_populates="items")
    product = relationship("Product") # Relação simples