from pydantic import BaseModel, Field, ConfigDict,field_validator,model_validator
from typing import List,Optional
from datetime import datetime
from decimal import Decimal
from .models import UserRole, CouponType,PaymentStatus

# --- Schemas de Categoria ---
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None # Novo: Descrição para IA/SEO
    
class CategoryCreate(CategoryBase):
    parent_id: Optional[int] = None # Novo: Criação de sub-categoria

class BarcodeResponse(BaseModel):
    barcode: str

class Category(CategoryBase):
    id: int
    parent_id: Optional[int] = None
    sub_categories: List['Category'] = [] # Novo: Recursividade para árvore
    model_config = ConfigDict(from_attributes=True)
    
class ProductBase(BaseModel):
    """Campos comuns visíveis para todos."""
    name: str
    description: str | None = None
    selling_price: Decimal
    stock_quantity: int # Cliente vê estoque (ex: "apenas 2 restantes") ou booleano
    image_url: str | None = None
    category_id: int | None = None
    cod_cat: str | None = None

class ProductPublic(ProductBase):
    """
    VIEW DO CLIENTE (LOJA):
    - Oculta: cost_price, supplier_ref, barcode interno
    - Mostra: Preço calculado (current_price)
    """
    id: int
    current_price: Decimal # Calculado pelo PricingEngine
    category: Optional[Category] = None
    model_config = ConfigDict(from_attributes=True)

class Product(ProductPublic):
    """
    VIEW DO ADMIN (BACKOFFICE):
    - Mostra TUDO (herda do Public + campos sensíveis)
    """
    cost_price: Decimal
    on_loan_quantity: int
    barcode: str | None = None
    supplier_ref: str | None = None # Novo
    
class ProductCreate(ProductBase):
    """Campos necessários para cadastro."""
    selling_price: Decimal = Field(..., gt=0)
    category_id: int | None = None
    cost_price: Decimal = Field(..., gt=0) # Obrigatório no cadastro
    supplier_ref: Optional[str] = None        # Novo: Opcional
    stock_quantity: int = 0
    barcode: str | None = None

class ProductUpdate(BaseModel):
    """Todos os campos opcionais para edição."""
    name: str | None = None
    description: str | None = None
    selling_price: Decimal | None = None
    cost_price: Decimal | None = None
    supplier_ref: str | None = None # Novo
    stock_quantity: int | None = None
    barcode: str | None = None
    image_url: str | None = None
    category_id: int | None = None
    cod_cat: str | None = None

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    instagram_handle: Optional[str] = None

# Schema para criar um usuário (pede uma senha)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=999)
    role: UserRole = UserRole.CUSTOMER
    is_active: bool = True

# Schema para ler/retornar um usuário (NUNCA retorne a senha)
class User(UserBase):
    id: int
    role: UserRole
    is_active: bool
    
    @field_validator('phone_number', mode='before')
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "":
            return None
        return v
    model_config = ConfigDict(from_attributes=True)

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    instagram_handle: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    instagram_handle: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

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
    subtotal: Optional[Decimal] = None
    applied_discount: Optional[Decimal] = None # Novo
    total_amount: Optional[Decimal] = None # Novo
    created_at: datetime | None = None
    items: List[OrderItemResponse] = [] # (Certifique-se que OrderItemResponse existe)
    payment_status: Optional[str] = "pending" 
    model_config = ConfigDict(from_attributes=True)

class OrderFilter(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[PaymentStatus] = None
    user_email: Optional[str] = None # Buscar por cliente
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None # Ex: "shipped", "delivered", "canceled"
    payment_status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    # Futuro: tracking_code: Optional[str] = None

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

class SalesCaseItemAdd(BaseModel):
    """
    Schema flexível: Aceita ID ou Barcode.
    """
    product_id: Optional[int] = None
    barcode: Optional[str] = None
    quantity: int = Field(..., gt=0, description="Quantidade a adicionar")

    @model_validator(mode='after')
    def check_identifier(self):
        if not self.product_id and not self.barcode:
            raise ValueError('É necessário fornecer product_id ou barcode.')
        return self

class SalesCaseItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, description="Nova quantidade absoluta. Se 0, remove o item.")

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

class AdminProductSearch(BaseModel):
    search_term: Optional[str] = None
    category_id: Optional[int] = None

class ProductFilter(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    category_id: Optional[int] = None
    only_promotions: bool = False
    search_term: Optional[str] = None

class InventoryStats(BaseModel):
    total_stock_quantity: int
    total_on_loan_quantity: int
    total_stock_value: Decimal  # Valor monetário (Preço de Custo * Qtd)
    total_on_loan_value: Decimal # Valor monetário na rua (Preço de Custo * Qtd)
# --- SCHEMAS DE CUPOM ---

class CouponBase(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: CouponType
    discount_value: Decimal = Field(..., gt=0)
    max_uses: Optional[int] = Field(None, gt=0)
    expiration_date: datetime
    min_purchase_amount: Decimal = Field(0.0, ge=0)
    is_active: bool = True

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

class AddressBase(BaseModel):
    name: str = Field(..., description="Apelido do endereço (ex: Casa)")
    recipient_name: str
    zip_code: str = Field(..., min_length=8, max_length=8)
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str = Field(..., min_length=2, max_length=2)
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    name: Optional[str] = None
    recipient_name: Optional[str] = None
    zip_code: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    complement: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_default: Optional[bool] = None

class Address(AddressBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# --- SCHEMAS DE FRETE ---

class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class ShippingOption(BaseModel):
    name: str # PAC, SEDEX, Motoboy
    price: float
    estimated_days: int

class ShippingSimulationRequest(BaseModel):
    zip_code: str = Field(..., min_length=8, max_length=8)
    items: List[CheckoutItem]

class CreditCard(BaseModel):
    holder_name: str
    number: str = Field(..., min_length=13, max_length=19)
    exp_month: str = Field(..., min_length=2, max_length=2)
    exp_year: str = Field(..., min_length=2, max_length=4)
    cvv: str = Field(..., min_length=3, max_length=4)

class PaymentRequest(BaseModel):
    order_id: int
    payment_method: str = "credit_card" # Por enquanto só simulamos cartão
    card_info: Optional[CreditCard] = None

class PaymentResponse(BaseModel):
    order_id: int
    status: str # approved, failed
    transaction_id: str
    message: str

class PixRequest(BaseModel):
    order_id: int

class PixResponse(BaseModel):
    order_id: int
    status: str # "pending"
    qr_code: str # O código "Copia e Cola"
    qr_code_url: Optional[str] = None # URL para imagem do QR (opcional)
    expires_at: datetime
    message: str

# Schema para simular o Webhook do banco (Aprovação)
class PixWebhookMock(BaseModel):
    order_id: int
    action: str = "pay" # pay, expire