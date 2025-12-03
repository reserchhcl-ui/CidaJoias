# NOVO ARQUIVO: tests/integration/test_shipping_endpoint.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from tests.utils.product import create_random_product

def test_shipping_simulation_endpoint(client: TestClient, db: Session):
    """
    Testa se o endpoint de simulação de frete responde corretamente
    com as opções de PAC e SEDEX baseadas na heurística de peso.
    """
    # Arrange
    # Produto leve (50g por padrão na heurística)
    product = create_random_product(db, selling_price=100.0)
    
    payload = {
        "zip_code": "12345678",
        "items": [
            {"product_id": product.id, "quantity": 2} # 100g produtos + 100g caixa = 200g total
        ]
    }

    # Act
    response = client.post(f"{settings.API_V1_STR}/shipping/simulate", json=payload)

    # Assert
    assert response.status_code == 200
    options = response.json()
    
    assert len(options) >= 2 # PAC e SEDEX
    
    pac = next(o for o in options if "PAC" in o["name"])
    sedex = next(o for o in options if "SEDEX" in o["name"])
    
    # Verifica valores base (pois peso < 1kg)
    assert pac["price"] == 20.00
    assert sedex["price"] == 35.00
    assert pac["estimated_days"] == 7
    assert sedex["estimated_days"] == 3

def test_shipping_free_shipping_trigger(client: TestClient, db: Session):
    """
    Testa se a opção de Frete Grátis aparece quando o valor supera R$ 500.
    """
    # Produto caro
    product = create_random_product(db, selling_price=600.0)
    
    payload = {
        "zip_code": "12345678",
        "items": [{"product_id": product.id, "quantity": 1}]
    }

    response = client.post(f"{settings.API_V1_STR}/shipping/simulate", json=payload)
    
    options = response.json()
    # Deve haver uma opção com preço 0.0
    free_option = next((o for o in options if o["price"] == 0.0), None)
    
    assert free_option is not None
    assert "Frete Grátis" in free_option["name"]