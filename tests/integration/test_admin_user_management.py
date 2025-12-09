# NOVO ARQUIVO: tests/integration/test_admin_user_management.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import UserRole
from tests.utils.user import create_random_user, create_user_and_get_headers
from tests.utils.product import create_random_product

def test_admin_can_update_other_user(client: TestClient, db: Session):
    """Testa se um Admin consegue alterar o perfil de outro usuário."""
    # Arrange
    admin_headers = create_user_and_get_headers(db, client, is_admin=True)
    target_user = create_random_user(db)
    
    update_data = {
        "full_name": "Nome Alterado Pelo Admin",
        "role": UserRole.SALES_REP.value # Promovendo o usuário
    }

    # Act
    response = client.put(
        f"{settings.API_V1_STR}/users/{target_user.id}",
        headers=admin_headers,
        json=update_data
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Nome Alterado Pelo Admin"
    assert data["role"] == UserRole.SALES_REP.value
    
    # Verifica no banco
    db.refresh(target_user)
    assert target_user.role == UserRole.SALES_REP

def test_admin_can_delete_user(client: TestClient, db: Session):
    """Testa se um Admin consegue deletar um usuário."""
    # Arrange
    admin_headers = create_user_and_get_headers(db, client, is_admin=True)
    target_user = create_random_user(db)
    
    # Act
    response = client.delete(
        f"{settings.API_V1_STR}/users/{target_user.id}",
        headers=admin_headers
    )

    # Assert
    assert response.status_code == 204
    
    # Verifica se sumiu do banco
    from app import crud
    assert crud.user.get(db, id=target_user.id) is None

def test_admin_cannot_delete_self(client: TestClient, db: Session):
    """Testa proteção contra auto-deleção de admin."""
    # Arrange
    # Precisamos saber o ID do admin logado. 
    # O helper create_user_and_get_headers cria um user novo a cada chamada.
    # Vamos criar manualmente para ter o ID.
    from tests.utils.user import create_random_user
    
    admin_user = create_random_user(db, is_admin=True)
    # Login
    token = client.post(f"{settings.API_V1_STR}/token", data={"username": admin_user.email, "password": "password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Act
    response = client.delete(
        f"{settings.API_V1_STR}/users/{admin_user.id}",
        headers=headers
    )

    # Assert
    assert response.status_code == 400
    assert "cannot delete your own account" in response.json()["detail"]

def test_admin_can_view_user_orders(client: TestClient, db: Session):
    """Testa se o Admin consegue ver o histórico de pedidos de um usuário."""
    # Arrange
    admin_headers = create_user_and_get_headers(db, client, is_admin=True)
    target_user = create_random_user(db)
    
    # Criar um pedido para esse usuário
    from app import crud, schemas
    product = create_random_product(db, selling_price=50.0, stock_quantity=10)
    order_in = schemas.OrderCreate(items=[schemas.OrderItemBase(product_id=product.id, quantity=1)])
    crud.order.create_order(db=db, user=target_user, order_create=order_in)

    # Act
    response = client.get(
        f"{settings.API_V1_STR}/users/{target_user.id}/orders",
        headers=admin_headers
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["user_id"] == target_user.id