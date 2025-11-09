from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Importar nossos modelos e schemas
from . import models, schemas, database

# --- Configuração de Criptografia de Senha (Hashing) ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Configuração do JWT (Token) ---
# (Em produção, estas chaves DEVEM estar no seu .env!)
SECRET_KEY = "yZXRvcnNvGEU" # Troque por uma string aleatória
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Token expira em 60 minutos

# Define o "esquema" de autenticação
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Funções de Segurança ---

def verify_password(plain_password, hashed_password):
    """Verifica se a senha em texto plano bate com o hash salvo."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Gera o hash de uma senha em texto plano."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Cria um novo token JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependências (Dependencies) ---

def get_user(db: Session, email: str):
    """Busca um usuário pelo email no banco de dados."""
    return db.query(models.User).filter(models.User.email == email).first()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    """
    Dependência para validar o token e retornar o usuário atual.
    Usaremos isso para proteger endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = get_user(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin_user(current_user: schemas.User = Depends(get_current_user)):
    """
    Dependência que REQUER que o usuário atual seja um admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user does not have administrative privileges"
        )
    return current_user