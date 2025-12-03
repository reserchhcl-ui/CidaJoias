# tests/integration/test_sales_case_return.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import SalesCaseStatus, UserRole
from tests.utils.user import create_user_and_get_headers, create_random_user
from tests.utils.product import create_random_product

def test_full_sales_case_lifecycle(client: TestClient, db: Session):
    """
    Testa o ciclo de vida completo de um estojo.
    """
    # --- ARRANGE ---
    admin_headers = create_user_and_get_headers(db, client, is_admin=True)
    
    # CORREÇÃO: Criamos a vendedora com senha conhecida
    sales_rep = create_random_user(db, password="password")
    sales_rep.role = UserRole.SALES_REP
    db.add(sales_rep)
    db.commit()
    
    # Login como Sales Rep
    login_resp = client.post(
        f"{settings.API_V1_STR}/token", 
        data={"username": sales_rep.email, "password": "password"}
    )
    assert login_resp.status_code == 200 # Validação extra
    rep_headers = login_resp.json()
    rep_auth = {"Authorization": f"Bearer {rep_headers['access_token']}"}

    # 2. Produto e Estoque
    product = create_random_product(db, selling_price=100.0, stock_quantity=50)
    
    # 3. Criar Estojo (Admin envia para Rep)
    case_data = {
        "sales_rep_id": sales_rep.id,
        "loan_duration_days": 30,
        "items": [{"product_id": product.id, "quantity": 10}]
    }
    create_resp = client.post(
        f"{settings.API_V1_STR}/sales-cases/",
        headers=admin_headers,
        json=case_data
    )
    assert create_resp.status_code == 201
    case_id = create_resp.json()["id"]

    # --- ACT (O Retorno) ---
    return_payload = {
        "items_sold": [
            {"product_id": product.id, "quantity_sold": 3}
        ]
    }
    
    return_resp = client.post(
        f"{settings.API_V1_STR}/sales-cases/{case_id}/return",
        headers=rep_auth,
        json=return_payload
    )

    # --- ASSERT ---
    assert return_resp.status_code == 200
    report = return_resp.json()
    
    assert report["total_items_sold"] == 3
    assert float(report["total_value_sold"]) == 300.0
    assert report["new_order_id"] is not None
    
    from app import crud
    db_case = crud.sales_case.get(db, case_id=case_id)
    assert db_case.status == SalesCaseStatus.RETURNED
    
    db.refresh(product)
    assert product.on_loan_quantity == 0
    assert product.stock_quantity == 47