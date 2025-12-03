# tests/utils/user.py

from typing import Dict
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from faker import Faker

from app import crud, schemas
from app.core.config import settings
from app.models import User, UserRole

fake = Faker()

def create_random_user(
    db: Session, 
    *, 
    is_admin: bool = False, 
    password: str = None # <--- NOVO PARÂMETRO
) -> User:
    """
    Cria um usuário com dados aleatórios no banco de dados de teste.
    Se 'password' for fornecido, usa-o; caso contrário, gera um aleatório.
    """
    email = fake.email()
    
    # Lógica corrigida para usar a senha fornecida ou gerar uma nova
    if password is None:
        password = fake.password(length=12)
    
    role = UserRole.ADMIN if is_admin else UserRole.CUSTOMER
    
    user_in = schemas.UserCreate(email=email, password=password, role=role)
    
    return crud.user.create(db=db, obj_in=user_in)

def user_authentication_headers(
    *, client: TestClient, email: str, password: str = "password"
) -> Dict[str, str]:
    """
    Simula o login e retorna os headers Authorization.
    """
    data = {"username": email, "password": password}

    response = client.post(f"{settings.API_V1_STR}/token", data=data)
    
    if response.status_code != 200:
        raise Exception(f"Falha ao autenticar usuário {email}: {response.text}")
        
    response_data = response.json()
    access_token = response_data["access_token"]
    
    return {"Authorization": f"Bearer {access_token}"}

def create_user_and_get_headers(
    db: Session, client: TestClient, *, is_admin: bool = False
) -> Dict[str, str]:
    """
    Cria usuário e retorna headers logados numa única chamada.
    """
    email = fake.email()
    password = fake.password(length=12)
    role = UserRole.ADMIN if is_admin else UserRole.CUSTOMER
    
    user_in = schemas.UserCreate(email=email, password=password, role=role)
    crud.user.create(db=db, obj_in=user_in)
    
    return user_authentication_headers(client=client, email=email, password=password)