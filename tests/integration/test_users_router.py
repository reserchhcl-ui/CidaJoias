# NOVO ARQUIVO: tests/integration/test_users_router.py

from fastapi.testclient import TestClient
from faker import Faker
from app.models import UserRole
fake = Faker()

def test_create_user_success(client: TestClient):
    """
    Testa o registro de um novo usuário com sucesso.
    Verifica se o status code é 201 e se os dados retornados estão corretos.
    """
    # --- Arrange ---
    password = fake.password(length=12)
    user_data = {
        "email": fake.email(),
        "password": password,
    }

    # --- Act ---
    response = client.post("/users/register", json=user_data)

    # --- Assert ---
    assert response.status_code == 201
    
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["role"] == UserRole.CUSTOMER.value
    assert "id" in data
    assert "password" not in data # CRÍTICO: nunca retornar a senha
    assert "hashed_password" not in data # CRÍTICO: nunca retornar o hash


def test_create_user_email_already_exists(client: TestClient):
    """
    Testa se o sistema retorna um erro 400 ao tentar registrar um email que já existe.
    """
    # --- Arrange ---
    password = fake.password(length=12)
    email = fake.email()
    user_data = {
        "email": email,
        "password": password,
    }
    
    # Cria o primeiro usuário
    response1 = client.post("/users/register", json=user_data)
    assert response1.status_code == 201

    # --- Act ---
    # Tenta criar o segundo usuário com o mesmo email
    response2 = client.post("/users/register", json=user_data)

    # --- Assert ---
    assert response2.status_code == 400
    assert response2.json() == {"detail": "Email already registered"}