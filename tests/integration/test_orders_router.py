# NOVO ARQUIVO: tests/integration/test_orders_router.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from tests.utils.user import create_user_and_get_headers
from tests.utils.product import create_random_product, create_discount_for_product

def test_checkout_captures_selling_price_when_no_discount(client: TestClient, db: Session):
    """
    Testa se o checkout registra o `selling_price` normal quando
    o produto não está em promoção.
    """
    # --- Arrange ---
    # Cria um usuário e obtém seus headers de autenticação
    user_headers = create_user_and_get_headers(db=db, client=client)
    
    # Cria um produto sem desconto, com estoque suficiente
    product = create_random_product(db, selling_price=250.0, stock_quantity=10)
    
    # Prepara o payload do "carrinho de compras"
    checkout_data = {
        "items": [{"product_id": product.id, "quantity": 2}]
    }

    # --- Act ---
    response = client.post(
        f"{settings.API_V1_STR}/orders/pedidos", 
        headers=user_headers, 
        json=checkout_data
    )

    # --- Assert ---
    assert response.status_code == 201
    order_data = response.json()
    
    # Valida se o preço "congelado" no item do pedido é o preço de venda padrão.
    order_item = order_data["items"][0]
    assert float(order_item["price_at_purchase"]) == 250.0

def test_checkout_captures_discount_price_at_purchase(client: TestClient, db: Session):
    """
    Testa a funcionalidade mais crítica: se um checkout registra o `discount_price`
    quando o produto está em promoção no momento da compra.
    """
    # --- Arrange ---
    user_headers = create_user_and_get_headers(db=db, client=client)
    
    # Cria um produto e, em seguida, um desconto ATIVO para ele
    product = create_random_product(db, selling_price=250.0, stock_quantity=10)
    create_discount_for_product(db, product_id=product.id, discount_price=199.99)
    
    checkout_data = {
        "items": [{"product_id": product.id, "quantity": 1}]
    }

    # --- Act ---
    response = client.post(
        f"{settings.API_V1_STR}/orders/pedidos", 
        headers=user_headers, 
        json=checkout_data
    )

    # --- Assert ---
    assert response.status_code == 201
    order_data = response.json()
    
    # VALIDAÇÃO CRÍTICA:
    # O preço registrado deve ser o preço com desconto, não o preço de venda original.
    order_item = order_data["items"][0]
    assert float(order_item["price_at_purchase"]) == 199.99