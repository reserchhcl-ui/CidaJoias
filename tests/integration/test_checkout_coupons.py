# tests/integration/test_checkout_coupons.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from app.core.config import settings
from app.models import CouponType, Order
from tests.utils.user import create_user_and_get_headers
from tests.utils.product import create_random_product
from tests.utils.coupon import create_coupon

def test_checkout_with_fixed_coupon(client: TestClient, db: Session):
    """
    Testa o fluxo completo de checkout aplicando um cupom de valor fixo (R$ 20,00).
    """
    # 1. Preparação
    user_headers = create_user_and_get_headers(db, client)
    product = create_random_product(db, selling_price=100.0, stock_quantity=10)
    
    # Criar cupom de R$ 20.00
    coupon = create_coupon(db, code="DESCONTO20", discount_value=20.0, discount_type=CouponType.FIXED)

    # 2. Validar Cupom (Simulação do Frontend)
    validate_resp = client.get(f"{settings.API_V1_STR}/coupons/validate/DESCONTO20?value=100.0")
    assert validate_resp.status_code == 200
    val_data = validate_resp.json()
    assert val_data["valid"] is True
    assert float(val_data["discount_amount"]) == 20.0
    assert float(val_data["new_total"]) == 80.0

    # 3. Fazer o Pedido
    checkout_payload = {
        "items": [{"product_id": product.id, "quantity": 1}],
        "coupon_code": "DESCONTO20"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/orders/pedidos",
        headers=user_headers,
        json=checkout_payload
    )

    # 4. Asserções
    assert response.status_code == 201
    order_data = response.json()
    
    # Verifica totais na resposta da API
    assert float(order_data["subtotal"]) == 100.0
    assert float(order_data["applied_discount"]) == 20.0
    assert float(order_data["total_amount"]) == 80.0
    
    # Verifica persistência no Banco de Dados
    db_order = db.query(Order).filter(Order.id == order_data["id"]).first()
    assert db_order.coupon_id == coupon.id
    assert db_order.total_amount == Decimal("80.00")
    
    # Verifica se o uso do cupom foi incrementado
    db.refresh(coupon)
    assert coupon.current_uses == 1

def test_checkout_with_invalid_coupon(client: TestClient, db: Session):
    """
    Testa tentativa de compra com cupom que não atinge o valor mínimo.
    """
    user_headers = create_user_and_get_headers(db, client)
    product = create_random_product(db, selling_price=50.0, stock_quantity=10)
    
    # Cupom exige mínimo de R$ 100,00
    create_coupon(db, code="RICO100", min_purchase=100.0)

    checkout_payload = {
        "items": [{"product_id": product.id, "quantity": 1}], # Total R$ 50,00
        "coupon_code": "RICO100"
    }
    
    response = client.post(
        f"{settings.API_V1_STR}/orders/pedidos",
        headers=user_headers,
        json=checkout_payload
    )

    # Deve falhar com 400 Bad Request
    assert response.status_code == 400
    assert "valor mínimo" in response.json()["detail"].lower()