# NOVO ARQUIVO: tests/utils/user.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from faker import Faker

from app import crud
from app.core.config import settings
from app.models import User
from app.schemas import UserCreate

fake = Faker()

def create_random_user(db: Session, *, is_admin: bool = False) -> User:
    """
    Cria um usuário com dados aleatórios no banco de dados de teste.
    Retorna o objeto do modelo SQLAlchemy do usuário criado.

    :param db: A sessão do banco de dados de teste.
    :param is_admin: Se o usuário a ser criado deve ter privilégios de administrador.
    """
    email = fake.email()
    password = fake.password(length=12)
    
    # Define o role com base no parâmetro is_admin
    # Isso simula a criação de usuários com diferentes níveis de permissão.
    role = "admin" if is_admin else "customer"
    
    user_in = UserCreate(email=email, password=password, role=role)
    
    # Usa a camada CRUD da aplicação para criar o usuário,
    # garantindo que a lógica (como o hashing de senha) seja a mesma da aplicação real.
    return crud.user.create(db=db, obj_in=user_in)

def user_authentication_headers(
    *, client: TestClient, email: str, password: str = "password"
) -> dict[str, str]:
    """
    Simula o fluxo de login para obter um token JWT e retorna
    os headers de autenticação prontos para serem usados em requisições.

    Assume uma senha padrão 'password' se nenhuma for fornecida,
    o que pode ser útil se a função create_random_user usar uma senha fixa.
    Para maior robustez, o ideal seria que create_random_user retornasse a senha.
    
    Vamos ajustar create_random_user para retornar a senha para um teste mais robusto.
    (Veja a versão final abaixo)
    
    :param client: O TestClient da FastAPI.
    :param email: O email do usuário para login.
    :param password: A senha do usuário para login.
    """
    data = {"username": email, "password": password}

    # Faz uma requisição POST para o endpoint de token
    response = client.post(f"{settings.API_V1_STR}/token", data=data)
    
    # Verifica se o login foi bem-sucedido
    if response.status_code != 200:
        raise Exception(f"Falha ao autenticar o usuário {email}. Status: {response.status_code}, Detalhe: {response.text}")
        
    response_data = response.json()
    access_token = response_data["access_token"]
    
    # Retorna o dicionário de headers no formato Bearer
    return {"Authorization": f"Bearer {access_token}"}

# --- VERSÃO FINAL E MAIS ROBUSTA ---
# Combinando as duas funções para um fluxo mais seguro e limpo

def create_user_and_get_headers(
    db: Session, client: TestClient, *, is_admin: bool = False
) -> dict[str, str]:
    """
    Função de alto nível que cria um usuário aleatório, faz o login
    com suas credenciais e retorna os headers de autenticação.
    Este é o utilitário preferencial para testes de endpoints protegidos.
    """
    email = fake.email()
    password = fake.password(length=12)
    role = "admin" if is_admin else "customer"
    
    user_in = UserCreate(email=email, password=password, role=role)
    crud.user.create(db=db, obj_in=user_in)
    
    # Usa a senha que acabamos de gerar para autenticar
    return user_authentication_headers(client=client, email=email, password=password)