# tests/integration/test_categories_router.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from tests.utils.user import create_user_and_get_headers
from tests.utils.category import create_random_category

def test_create_category_as_admin(client: TestClient, db: Session):
    admin_headers = create_user_and_get_headers(db, client, is_admin=True)
    data = {"name": "Joias Raras", "slug": "joias-raras"}
    
    response = client.post(
        f"{settings.API_V1_STR}/categories/", 
        headers=admin_headers, 
        json=data
    )
    assert response.status_code == 201
    content = response.json()
    assert content["slug"] == "joias-raras"
    assert "id" in content

def test_create_category_as_normal_user_forbidden(client: TestClient, db: Session):
    user_headers = create_user_and_get_headers(db, client, is_admin=False)
    data = {"name": "Forbidden Cat", "slug": "forbidden"}
    
    response = client.post(
        f"{settings.API_V1_STR}/categories/", 
        headers=user_headers, 
        json=data
    )
    assert response.status_code == 403

def test_read_categories(client: TestClient, db: Session):
    create_random_category(db)
    create_random_category(db)
    
    response = client.get(f"{settings.API_V1_STR}/categories/")
    assert response.status_code == 200
    assert len(response.json()) >= 2