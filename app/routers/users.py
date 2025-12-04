# app/routers/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from .. import models, schemas, auth, security, crud
from ..core.config import settings
from ..database import get_db

# Defina o prefixo aqui para evitar repetição nas rotas
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# --- ROTAS PÚBLICAS OU DE AUTENTICAÇÃO ---

# Nota: O endpoint de token geralmente fica na raiz ou em /auth, 
# mas se o frontend espera em /users/token ou /token direto, precisamos alinhar.
# O padrão no main.py é incluir este router. Se o router tem prefix="/users", 
# a rota abaixo vira "/users/register".

@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    user_in: schemas.UserCreate, 
    db: Session = Depends(get_db)
):
    """Cria um novo usuário (Cliente)."""
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    return crud.user.create(db, obj_in=user_in)

# Para manter compatibilidade com a rota /token (que geralmente é raiz), 
# podemos criar um router separado para auth ou adicionar uma exceção no main.py.
# Mas vamos assumir que o frontend chama /api/v1/token. 
# Para isso funcionar dentro deste router com prefixo /users, a rota seria /users/token.
# VOU CRIAR UMA ROTA ESPECÍFICA SEM O PREFIXO NO MAIN.PY PARA O TOKEN, 
# OU DEFINIR AQUI COM CAMINHO ABSOLUTO SE O FASTAPI PERMITISSE.
# SOLUÇÃO: Vamos manter o /token aqui mas sabendo que ele ficará em /api/v1/users/token 
# SE não mudarmos a estrutura.
# 
# POREM, o OAuth2PasswordBearer no auth.py aponta para "token".
# Vamos criar um endpoint auxiliar /login que redireciona ou faz o mesmo.

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = crud.user.authenticate(db, email=form_data.username, password=form_data.password)
    # Nota: Precisamos adicionar o método 'authenticate' no CRUD ou fazer manualmente aqui:
    user = crud.user.get_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": auth.create_access_token(
            id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

# --- ROTA QUE FALTAVA: DADOS DO USUÁRIO LOGADO ---

@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Retorna os dados do usuário atualmente logado.
    Vital para o Frontend saber quem é o usuário e suas permissões.
    """
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Atualiza o próprio perfil (ex: trocar senha ou email).
    """
    # Segurança: Não permitir que usuário mude seu próprio role para admin
    if user_in.role is not None and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="You cannot change your own role.")
        
    return crud.user.update(db, db_obj=current_user, obj_in=user_in)

# --- ROTAS ADMINISTRATIVAS ---

@router.get("/", response_model=List[schemas.User], dependencies=[Depends(auth.require_admin_user)])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    (Admin) Lista todos os usuários.
    """
    return crud.user.get_multi(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(auth.require_admin_user)])
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    (Admin) Busca usuário por ID.
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user