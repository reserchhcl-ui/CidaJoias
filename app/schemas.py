from pydantic import BaseModel, Field, ConfigDict, validator
from .models import UserRole
from typing import List,Optional
from datetime import datetime
from decimal import Decimal
from .models import CouponType
# --- Schemas de Categoria ---
class CategoryBase(BaseModel):
    name: str
    slug: str
class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    description: str | None = None 
    selling_price: Decimal
    stock_quantity: int
    image_url: str | None = None
    category_id: int | None = None # Link opcional para criação

class Product(ProductBase):
    id: int
    barcode: str | None = None
    current_price: float 
    cost_price: float # Admins podem querer ver isso
    category: Optional[Category] = None
    model_config = ConfigDict(from_attributes=True)

class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    selling_price: Decimal = Field(..., gt=0)
    cost_price: Decimal = Field(..., gt=0)
    stock_quantity: int = 0
    barcode: str | None = None
    image_url: str | None = None

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    selling_price: Decimal | None = None 
    cost_price: Decimal | None = None    # Adicionado
    stock_quantity: int | None = None
    barcode: str | None = None
    image_url: str | None = None
    category_id: int | None = None

class UserBase(BaseModel):
    email: str
    
# Schema para criar um usuário (pede uma senha)
class UserCreate(UserBase):
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=999
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
    subtotal: Decimal # Novo
    applied_discount: Decimal # Novo
    total_amount: Decimal # Novo
    items: List[OrderItemResponse] = [] # (Certifique-se que OrderItemResponse existe)

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
    coupon_code: Optional[str] = None

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

class ProductFilter(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    category_id: Optional[int] = None
    only_promotions: bool = False
    search_term: Optional[str] = None

# --- SCHEMAS DE CUPOM ---

class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: CouponType
    discount_value: Decimal = Field(..., gt=0)
    max_uses: Optional[int] = Field(None, gt=0)
    expiration_date: datetime
    min_purchase_amount: Decimal = Field(0.0, ge=0)
    is_active: bool = True

    @validator('code')
    def uppercase_code(cls, v):
        return v.upper().strip()

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    discount_type: Optional[CouponType] = None
    discount_value: Optional[Decimal] = None
    max_uses: Optional[int] = None
    expiration_date: Optional[datetime] = None
    min_purchase_amount: Optional[Decimal] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: int
    current_uses: int
    model_config = ConfigDict(from_attributes=True)