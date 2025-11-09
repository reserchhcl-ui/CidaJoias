from pydantic import BaseModel, Field

# Este será o "schema" que a API retornará ao listar produtos.
# Note que ele NÃO é o modelo do SQLAlchemy, é um modelo Pydantic.
class ProductBase(BaseModel):
    name: str
    description: str | None = None # Permite que seja Nulo (Python 3.10+)
    price: float
    stock_quantity: int
    image_url: str | None = None

# Schema para exibir o produto (incluindo o ID)
class Product(ProductBase):
    id: int
    barcode: str | None = None

    # Configuração para dizer ao Pydantic para ler os dados
    # mesmo que não seja um dict, mas sim um objeto ORM (SQLAlchemy)
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
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
    is_admin: bool = False

# Schema para ler/retornar um usuário (NUNCA retorne a senha)
class User(UserBase):
    id: int
    is_admin: bool

    class Config:
        from_attributes = True

# --- Schemas de Autenticação ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None