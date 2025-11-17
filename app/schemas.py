from pydantic import BaseModel, Field,ConfigDict
from .models import UserRole
from typing import List,Optional
from datetime import datetime
from decimal import Decimal
# Este será o "schema" que a API retornará ao listar produtos.
# Note que ele NÃO é o modelo do SQLAlchemy, é um modelo Pydantic.
class ProductBase(BaseModel):
    name: str
    description: str | None = None # Permite que seja Nulo (Python 3.10+)
    selling_price: Decimal
    stock_quantity: int
    image_url: str | None = None

# Schema para exibir o produto (incluindo o ID)
class Product(ProductBase):
    id: int
    barcode: str | None = None
    current_price: Decimal 
    cost_price: Decimal # Admins podem querer ver isso

    model_config = ConfigDict(from_attributes=True)

class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    selling_price: Decimal = Field(..., gt=0)
    cost_price: Decimal = Field(..., gt=0) # Preço de custo é obrigatório
    stock_quantity: int = 0
    barcode: str | None = None
    image_url: str | None = None

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock_quantity: int | None = None
    barcode: str | None = None
    image_url: str | None = None
class UserBase(BaseModel):
    email: str
    
# Schema para criar um usuário (pede uma senha)
class UserCreate(UserBase):
    password: str = Field(
        ...,  # O '...' significa que o campo ainda é obrigatório
        min_length=8,  # Boa prática: exigir senha com pelo menos 8 caracteres
        max_length=999  # Nosso escudo: recusa senhas > 72 caracteres
    )
    role: UserRole = UserRole.CUSTOMER

# Schema para ler/retornar um usuário (NUNCA retorne a senha)
class User(UserBase):
    id: int
    role: UserRole


    model_config = ConfigDict(from_attributes=True)

# --- Schemas de Autenticação ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

# --- Schemas de Encomendas (Orders) ---

# Schema para um item individual DENTRO de uma encomenda
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0) # Quantidade deve ser maior que zero

# Schema para a criação de uma encomenda (o que recebemos no POST)
class OrderCreate(BaseModel):
    items: List[OrderItemBase]

# --- Schemas de Resposta ---

# Schema para um item dentro da resposta da API
class OrderItemResponse(OrderItemBase):
    id: int
    price_at_purchase: float # Usamos float na API para ser compatível com JSON

    model_config = ConfigDict(from_attributes=True)

# Schema completo para a resposta da API (a encomenda criada)
class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class SalesCaseItemResponse(BaseModel):
    product_id: int
    quantity: int

    model_config = ConfigDict(from_attributes=True)

class SalesCaseResponse(BaseModel):
    id: int
    sales_rep_id: int
    loan_date: datetime
    return_by_date: datetime
    status: str # O Enum será convertido para string
    items: List[SalesCaseItemResponse] = []
    # Poderíamos incluir detalhes da vendedora aqui se quiséssemos
    # sales_rep: User 


    model_config = ConfigDict(from_attributes=True)

# --- Schemas para o Corpo do Pedido (o que o cliente envia) ---

class SalesCaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")

class SalesCaseCreate(BaseModel):
    sales_rep_id: int
    loan_duration_days: int = Field(..., gt=0, le=90, description="Duration in days (1-90)")
    items: List[SalesCaseItemCreate]

class ItemSold(BaseModel):
    product_id: int
    quantity_sold: int = Field(..., ge=0) # Pode ser 0, mas não negativo

class SalesCaseReturnRequest(BaseModel):
    items_sold: List[ItemSold]

# Output: O que a API devolve como relatório
class ItemReturnSummary(BaseModel):
    product_name: str
    quantity_loaned: int
    quantity_sold: int
    quantity_returned: int
    price_per_item: float
    subtotal_sold: float

class SalesCaseReturnReport(BaseModel):
    case_id: int
    new_order_id: Optional[int] = None # O ID da nova encomenda gerada, se houver
    sales_rep_id: int
    date_returned: datetime
    total_items_sold: int
    total_value_sold: float
    items_summary: List[ItemReturnSummary]

class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")

class CheckoutRequest(BaseModel):
    items: List[CheckoutItem]

class DiscountBase(BaseModel):
    product_id: int
    discount_price: Decimal
    end_time: datetime

class DiscountCreate(DiscountBase):
    pass # Por enquanto, o mesmo que a base

class Discount(DiscountBase):
    id: int
    start_time: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DiscountUpdate(BaseModel):
    discount_price: Optional[Decimal] = None
    end_time: Optional[datetime] = None