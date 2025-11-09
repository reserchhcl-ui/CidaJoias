from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List # Para tipar a nossa lista de retorno
from fastapi import FastAPI, Depends, HTTPException, status
# Importe o 'OAuth2PasswordRequestForm' para o login
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from . import models, schemas, auth # Importe o novo arquivo 'auth'
from .database import SessionLocal, engine, get_db # get_db já existe


# Cria as tabelas no banco de dados (se não existirem)
# (Em um projeto de produção, usaríamos migrações (Alembic),
# mas para agora, isso é o suficiente)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cida Joias API",
    description="Back-end."
)

# --- Dependência (Dependency) ---
# Esta função gerencia a sessão do banco de dados para cada pedido.

# ---------------------------------

@app.get("/")
def read_root():
    """
    Endpoint raiz. Apenas diz 'Olá' para confirmar que a API está no ar.
    """
    return {"message": "Bem-vindo à API da Nossa Loja!"}

# --- ENDPOINT DE REGISTRO (CRIAR USUÁRIO) ---
@app.post("/users/register", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Cria um novo usuário (cliente da loja).
    """
    # Verifica se o e-mail já existe
    db_user = auth.get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Criptografa a senha antes de salvar
    hashed_password = auth.get_password_hash(user.password)
    
    # Cria o novo objeto de usuário (modelo SQLAlchemy)
    # Note que NÃO salvamos user.password, mas sim o hash
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        is_admin=user.is_admin
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Recarrega o objeto do BD (para pegar o ID)
    return db_user

# --- ENDPOINT DE LOGIN (GERAR TOKEN) ---
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Endpoint de login. Recebe 'username' (nosso email) e 'password'.
    Retorna um Token JWT.
    """
    # 1. Autentica o usuário
    user = auth.get_user(db, email=form_data.username) # O form usa 'username'
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Cria o token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
# --- O NOSSO NOVO ENDPOINT ---

# response_model=List[schemas.Product] diz ao FastAPI:
# "A resposta será uma LISTA de objetos que seguem o schema Product"
@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Lê todos os produtos do banco de dados, com paginação.
    """
    # Usamos a sessão (db) para fazer uma query no modelo (models.Product)
    products = db.query(models.Product).offset(skip).limit(limit).all()
    
    # O FastAPI (graças ao orm_mode) irá converter automaticamente
    # a lista 'products' (objetos SQLAlchemy) para o formato JSON
    # definido em schemas.Product.
    return products

@app.post("/products/", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,  # 1. O 'body' da requisição (valido por Pydantic)
    db: Session = Depends(get_db),     # 2. A nossa dependência do banco de dados

    # 3. A NOSSA DEPENDÊNCIA DE SEGURANÇA:
    #    - Exige um token válido
    #    - Exige que o utilizador desse token tenha 'is_admin = True'
    current_admin: schemas.User = Depends(auth.get_current_admin_user)
):
    """
    Cria um novo produto na base de dados.
    Este endpoint é protegido e requer privilégios de administrador.
    """

    # 4. Lógica de Negócio (Opcional, mas boa prática)
    #    Vamos verificar se o código de barras já existe
    if product.barcode:
        db_product = db.query(models.Product).filter(models.Product.barcode == product.barcode).first()
        if db_product:
            raise HTTPException(status_code=400, detail="Barcode already registered")

    # 5. Criar o objeto do modelo SQLAlchemy
    #    Usamos .model_dump() (Pydantic v2) para converter o schema
    #    num dicionário que o SQLAlchemy entende
    db_product = models.Product(**product.model_dump())

    # 6. Adicionar ao banco de dados
    db.add(db_product)
    db.commit()
    db.refresh(db_product) # Atualiza o objeto 'db_product' com o ID do banco

    # 7. Retornar o produto criado (o FastAPI irá convertê-lo para o schema 'schemas.Product')
    return db_product

@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,                      # 1. O ID vem da URL
    product_update: schemas.ProductUpdate, # 2. O 'body' com os dados a atualizar
    db: Session = Depends(get_db),
    current_admin: schemas.User = Depends(auth.get_current_admin_user)
):
    """
    Atualiza um produto existente na base de dados.
    Requer privilégios de administrador.
    """

    # 3. Encontrar o produto no banco de dados
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    # 4. Verificar se o produto existe
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    # 5. Converter o 'body' (product_update) num dicionário
    #    exclude_unset=True é a magia: ele só inclui os campos
    #    que o cliente REALMENTE enviou, ignorando os nulos.
    update_data = product_update.model_dump(exclude_unset=True)

    # 6. Atualizar o objeto do banco de dados
    #    Iteramos pelo dicionário e atualizamos cada campo
    for key, value in update_data.items():
        setattr(db_product, key, value)

    # 7. Salvar as alterações
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # 8. Retornar o produto atualizado
    return db_product

@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: schemas.User = Depends(auth.get_current_admin_user)
):
    """
    Deleta um produto da base de dados.
    Requer privilégios de administrador.
    """

    # 1. Encontrar o produto no banco de dados
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    # 2. Verificar se o produto existe
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # 3. Deletar o produto
    db.delete(db_product)
    db.commit()

    # 4. Retornar 'None'
    #    Como definimos o status_code=204, o FastAPI
    #    retornará uma resposta sem 'body', o que é a
    #    melhor prática para DELETE.
    return None