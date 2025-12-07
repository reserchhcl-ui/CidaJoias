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
    Atualiza o próprio perfil.
    """
    # 1. Convertemos para DICT para manipular chaves livremente
    # exclude_unset=True evita que campos não enviados sobrescrevam dados com None
    update_data = user_in.model_dump(exclude_unset=True)

    # 2. Lógica de Segurança para 'role'
    if "role" in update_data:
        # Se não for admin...
        if current_user.role != models.UserRole.ADMIN:
            # ...e tentou alterar o papel para outro diferente: PROIBIDO
            if update_data["role"] != current_user.role:
                raise HTTPException(status_code=403, detail="You cannot change your own role.")
            
            # ...se enviou o mesmo papel (comum em forms de frontend):
            # REMOVEMOS A CHAVE do dicionário.
            # Isso impede que o sistema tente gravar 'role' no banco (evitando o erro NotNullViolation se fosse None, 
            # e evitando uma query de update desnecessária).
            del update_data["role"]

    # 3. Passamos o dicionário 'update_data' limpo para o CRUD
    return crud.user.update(db, db_obj=current_user, obj_in=update_data)

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

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: models.User = Depends(auth.get_current_user)):
    """
    Realiza o logout do usuário.
    
    Nota: Em arquiteturas JWT Stateless, o token permanece válido até expirar.
    Este endpoint instrui o cliente a descartar o token e pode ser usado futuramente
    para adicionar o token a uma 'Blacklist' (Redis) ou limpar cookies HttpOnly.
    """
    return {"message": "Successfully logged out"}