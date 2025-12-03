# tests/integration/test_security_rbac.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.config import settings
from tests.utils.user import create_random_user
from tests.utils.product import create_random_product
from app.models import UserRole, SalesCase # Import SalesCase directly

def test_sales_rep_cannot_see_other_rep_cases(client: TestClient, db: Session):
    """
    Garante que a Vendedora A não consiga listar ou ver detalhes
    dos estojos da Vendedora B.
    """
    # --- ARRANGE ---
    # CORREÇÃO: Senhas conhecidas
    rep_a = create_random_user(db, password="password")
    rep_a.role = UserRole.SALES_REP
    db.add(rep_a)
    
    rep_b = create_random_user(db, password="password")
    rep_b.role = UserRole.SALES_REP
    db.add(rep_b)
    db.commit()

    # 2. Autenticar como Alice (Rep A)
    login_resp = client.post(
        f"{settings.API_V1_STR}/token", 
        data={"username": rep_a.email, "password": "password"}
    )
    assert login_resp.status_code == 200
    token_a = login_resp.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 3. Criar (como Admin) um estojo para Bob (Rep B)
    # (Hack: criando via DB direto para agilizar o arrange)
    from datetime import datetime, timedelta, timezone
    
    # Criar produto dummy se necessário, mas SalesCase precisa apenas de ID valido no teste de listagem simples
    # se a query carregar eager load, pode precisar. Vamos criar simples.
    case_for_b = SalesCase(
        sales_rep_id=rep_b.id,
        return_by_date=datetime.now(timezone.utc) + timedelta(days=7),
        status="on_loan"
    )
    db.add(case_for_b)
    db.commit()
    db.refresh(case_for_b)

    # --- ACT & ASSERT ---
    
    # 1. Tentativa de Listagem
    response_list = client.get(f"{settings.API_V1_STR}/sales-cases/", headers=headers_a)
    assert response_list.status_code == 200
    data = response_list.json()
    
    # Verifica se o ID do estojo de Bob está na lista de Alice
    ids_visible = [c["id"] for c in data]
    assert case_for_b.id not in ids_visible

    # 2. Tentativa de Acesso Direto
    response_detail = client.get(f"{settings.API_V1_STR}/sales-cases/{case_for_b.id}", headers=headers_a)
    
    # Deve retornar 403 Forbidden
    assert response_detail.status_code == 403
    assert "Not authorized" in response_detail.json()["detail"]