# NOVO ARQUIVO: tests/integration/test_products_router.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
# Importa os novos utilitários
from tests.utils.product import create_random_product, create_discount_for_product

def test_read_product_shows_selling_price_when_no_discount(client: TestClient, db: Session):
    """
    Verifica se a API de produtos retorna o `selling_price` como `current_price`
    quando não há nenhum desconto ativo para aquele produto.
    """
    # --- Arrange ---
    # Usa o utilitário para criar um produto de teste de forma limpa.
    product = create_random_product(db, cost_price=50.0, selling_price=100.0)

    # --- Act ---
    response = client.get(f"{settings.API_V1_STR}/products/{product.id}")

    # --- Assert ---
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product.id
    assert float(data["selling_price"]) == 100.0
    assert float(data["current_price"]) == 100.0  # O preço atual deve ser igual ao de venda

def test_read_product_shows_discount_price_when_discount_is_active(client: TestClient, db: Session):
    """
    Verifica se a API de produtos retorna o `discount_price` como `current_price`
    quando existe um desconto ativo para aquele produto.
    """
    # --- Arrange ---
    product = create_random_product(db, cost_price=50.0, selling_price=100.0)
    # Usa o utilitário para criar um desconto associado ao produto.
    create_discount_for_product(db, product_id=product.id, discount_price=79.90)

    # --- Act ---
    response = client.get(f"{settings.API_V1_STR}/products/{product.id}")

    # --- Assert ---
    assert response.status_code == 200
    data = response.json()
    assert float(data["selling_price"]) == 100.0  # O preço de venda original permanece o mesmo
    assert float(data["current_price"]) == 79.90  # O preço atual reflete o desconto ativo

def test_read_products_list_shows_correct_current_prices(client: TestClient, db: Session):
    """
    Verifica se o endpoint de listagem de produtos enriquece
    corretamente cada produto com seu respectivo `current_price`.
    """
    # --- Arrange ---
    # Cria um produto sem desconto e um com desconto
    product_A = create_random_product(db, selling_price=50.0)
    product_B = create_random_product(db, selling_price=200.0)
    create_discount_for_product(db, product_id=product_B.id, discount_price=149.50)

    # --- Act ---
    response = client.get(f"{settings.API_V1_STR}/products/")
    assert response.status_code == 200
    data = response.json()

    # --- Assert ---
    # Encontra os produtos na resposta e verifica seus preços
    product_A_data = next((p for p in data if p["id"] == product_A.id), None)
    product_B_data = next((p for p in data if p["id"] == product_B.id), None)
    
    assert product_A_data is not None
    assert product_B_data is not None
    
    assert float(product_A_data["current_price"]) == 50.0
    assert float(product_B_data["current_price"]) == 149.50