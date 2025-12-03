# tests/integration/test_payment_flow.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import PaymentStatus, Order
from tests.utils.user import create_user_and_get_headers
from tests.utils.product import create_random_product

def test_payment_success_flow(client: TestClient, db: Session):
    # 1. Arrange: Criar Pedido
    headers = create_user_and_get_headers(db, client)
    product = create_random_product(db, selling_price=100.0, stock_quantity=10)
    
    checkout_data = {"items": [{"product_id": product.id, "quantity": 1}]}
    order_resp = client.post(f"{settings.API_V1_STR}/orders/pedidos", headers=headers, json=checkout_data)
    order_id = order_resp.json()["id"]

    # 2. Act: Pagar com cartão "bom" (final 1)
    payment_data = {
        "order_id": order_id,
        "card_info": {
            "holder_name": "Test User",
            "number": "4111111111111", # Final 1 = Sucesso
            "exp_month": "12",
            "exp_year": "2030",
            "cvv": "123"
        }
    }
    
    pay_resp = client.post(f"{settings.API_V1_STR}/payments/process", headers=headers, json=payment_data)

    # 3. Assert
    assert pay_resp.status_code == 200
    data = pay_resp.json()
    assert data["status"] == "approved"
    
    # Verifica no banco
    db_order = db.query(Order).filter(Order.id == order_id).first()
    assert db_order.payment_status == PaymentStatus.APPROVED
    assert db_order.status == "paid_ready_to_ship"

def test_payment_failure_flow(client: TestClient, db: Session):
    # 1. Arrange
    headers = create_user_and_get_headers(db, client)
    product = create_random_product(db, selling_price=100.0, stock_quantity=10)
    order_resp = client.post(f"{settings.API_V1_STR}/orders/pedidos", headers=headers, json={"items": [{"product_id": product.id, "quantity": 1}]})
    order_id = order_resp.json()["id"]

    # 2. Act: Pagar com cartão "ruim" (final 2)
    payment_data = {
        "order_id": order_id,
        "card_info": {
            "holder_name": "Test User",
            "number": "4111111111112", # Final 2 = Falha
            "exp_month": "12",
            "exp_year": "2030",
            "cvv": "123"
        }
    }
    
    pay_resp = client.post(f"{settings.API_V1_STR}/payments/process", headers=headers, json=payment_data)

    # 3. Assert
    assert pay_resp.status_code == 200 # O request funcionou, o pagamento que falhou
    data = pay_resp.json()
    assert data["status"] == "failed"
    
    db_order = db.query(Order).filter(Order.id == order_id).first()
    assert db_order.payment_status == PaymentStatus.FAILED
    assert db_order.status == "processing" # Não avançou logisticamente