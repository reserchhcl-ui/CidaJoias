from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Importar nossos modelos e schemas
from . import models, schemas, database, crud
from .models import UserRole


# --- Configuração do JWT (Token) ---
# (Em produção, estas chaves DEVEM estar no seu .env!)
SECRET_KEY = "yZXRvcnNvGEU" # Troque por uma string aleatória
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Token expira em 60 minutos

# Define o "esquema" de autenticação
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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
    
    user = crud.get_user_by_email(db, email=token_data.email)
    
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

def require_role(required_role: UserRole):
    """
    Uma fábrica de dependências que cria uma dependência para um 'role' específico.
    """
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have the required '{required_role.value}' privilege"
            )
        return current_user
    return role_checker

# Agora podemos criar dependências específicas e reutilizáveis
require_admin_user = require_role(UserRole.ADMIN)
require_sales_rep_user = require_role(UserRole.SALES_REP)