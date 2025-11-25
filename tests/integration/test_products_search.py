# tests/integration/test_products_search.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from tests.utils.product import create_random_product, create_discount_for_product
from tests.utils.category import create_random_category

def test_search_products_by_text(client: TestClient, db: Session):
    # Arrange
    p1 = create_random_product(db, selling_price=100)
    p1.name = "Anel de Ouro Exclusivo"
    db.add(p1)
    db.commit()
    
    p2 = create_random_product(db, selling_price=100)
    p2.name = "Colar de Prata Simples"
    db.add(p2)
    db.commit()

    # Act
    search_payload = {"search_term": "Ouro"}
    response = client.post(f"{settings.API_V1_STR}/products/search", json=search_payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == p1.id

def test_search_products_by_price_range(client: TestClient, db: Session):
    # Arrange
    create_random_product(db, selling_price=50.0)  # Barato
    create_random_product(db, selling_price=150.0) # Médio
    create_random_product(db, selling_price=500.0) # Caro

    # Act - Buscar produtos entre 100 e 200
    payload = {"min_price": 100.0, "max_price": 200.0}
    response = client.post(f"{settings.API_V1_STR}/products/search", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert float(data[0]["selling_price"]) == 150.0

def test_search_only_promotions(client: TestClient, db: Session):
    # Arrange
    p_normal = create_random_product(db, selling_price=100.0)
    p_promo = create_random_product(db, selling_price=100.0)
    create_discount_for_product(db, product_id=p_promo.id, discount_price=80.0)

    # Act
    payload = {"only_promotions": True}
    response = client.post(f"{settings.API_V1_STR}/products/search", json=payload)

    # Assert
    data = response.json()
    # Deve encontrar apenas o produto com desconto
    ids = [p["id"] for p in data]
    assert p_promo.id in ids
    assert p_normal.id not in ids