# NOVO ARQUIVO: tests/integration/test_discounts_router.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.config import settings
from tests.utils.user import create_random_user, user_authentication_headers
from tests.utils.product import create_random_product

def test_admin_can_create_valid_discount(client: TestClient, db: Session):
    """
    Testa o 'caminho feliz': um admin logado cria um desconto
    válido (preço > custo).
    """
    # --- Arrange ---
    # 1. Criar um usuário admin e obter seu token de autenticação
    admin_user = create_random_user(db, is_admin=True)
    admin_headers = user_authentication_headers(client=client, email=admin_user.email)
    
    # 2. Criar um produto no banco de dados de teste
    product = create_random_product(db, cost_price=50.0, selling_price=100.0)
    
    # 3. Preparar os dados do desconto
    discount_data = {
        "product_id": product.id,
        "discount_price": 75.0, # Preço válido (75 > 50)
        "end_time": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }

    # --- Act ---
    response = client.post(
        f"{settings.API_V1_STR}/discounts/", 
        headers=admin_headers, 
        json=discount_data
    )

    # --- Assert ---
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == product.id
    assert data["discount_price"] == 75.0
    
def test_admin_cannot_create_discount_below_cost_price(client: TestClient, db: Session):
    """
    Testa a REGRA DE NEGÓCIO BLINDADA: tentativa de criar um desconto
    com preço abaixo do custo deve falhar com erro 400.
    """
    # --- Arrange ---
    admin_user = create_random_user(db, is_admin=True)
    admin_headers = user_authentication_headers(client=client, email=admin_user.email)
    product = create_random_product(db, cost_price=50.0, selling_price=100.0)
    
    discount_data = {
        "product_id": product.id,
        "discount_price": 49.99, # Preço INVÁLIDO (49.99 < 50)
        "end_time": (datetime.utcnow() + timedelta(days=7)).isoformat()
    }

    # --- Act ---
    response = client.post(
        f"{settings.API_V1_STR}/discounts/", 
        headers=admin_headers, 
        json=discount_data
    )

    # --- Assert ---
    assert response.status_code == 400
    assert "cannot be lower than the product's cost price" in response.json()["detail"]

def test_normal_user_cannot_create_discount(client: TestClient, db: Session):
    """
    Testa a SEGURANÇA: um usuário normal (não admin) não pode
    acessar o endpoint de criação de descontos.
    """
    # --- Arrange ---
    normal_user = create_random_user(db, is_admin=False)
    user_headers = user_authentication_headers(client=client, email=normal_user.email)
    product = create_random_product(db, cost_price=50.0, selling_price=100.0)
    
    discount_data = {"product_id": product.id, "discount_price": 75.0, "end_time": (datetime.utcnow() + timedelta(days=7)).isoformat()}

    # --- Act ---
    response = client.post(f"{settings.API_V1_STR}/discounts/", headers=user_headers, json=discount_data)

    # --- Assert ---
    assert response.status_code == 403 # Forbidden