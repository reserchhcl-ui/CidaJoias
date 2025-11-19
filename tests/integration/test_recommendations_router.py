# NOVO ARQUIVO: tests/integration/test_recommendations_router.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app import crud, models
from tests.utils.user import create_user_and_get_headers
from tests.utils.product import create_random_product

def test_get_recommendations_excludes_purchased_items(client: TestClient, db: Session):
    """
    Testa se o sistema de recomendação:
    1. Retorna produtos.
    2. NÃO retorna produtos que o utilizador já comprou.
    """
    # --- Arrange ---
    # 1. Criar um utilizador e obter headers
    headers = create_user_and_get_headers(db=db, client=client)
    
    # Obter o ID do utilizador criado (extraindo do email usado no header ou buscando no banco)
    # Como o helper create_user_and_get_headers cria um user aleatório, precisamos recuperá-lo.
    # Uma forma simples é pegar o /users/me se existisse, ou confiar na ordem de criação.
    # Aqui, vamos buscar o último user criado, que deve ser o nosso.
    user = db.query(models.User).order_by(models.User.id.desc()).first()

    # 2. Criar 3 produtos
    p1 = create_random_product(db, selling_price=100.0) # Será comprado
    p2 = create_random_product(db, selling_price=100.0) # Será recomendado
    p3 = create_random_product(db, selling_price=100.0) # Será recomendado

    # 3. Simular que o utilizador comprou o Produto 1
    order = crud.order.create_order(db=db, user_id=user.id, status="completed")
    crud.order.create_order_item(db=db, order_id=order.id, product_id=p1.id, quantity=1, price_at_purchase=100.0)
    db.commit()

    # --- Act ---
    response = client.get(f"{settings.API_V1_STR}/recommendations/", headers=headers)

    # --- Assert ---
    assert response.status_code == 200
    data = response.json()
    
    # Verifica se recebemos uma lista
    assert isinstance(data, list)
    
    # Coleta os IDs retornados
    returned_ids = [item["id"] for item in data]
    
    # O produto 1 (comprado) NÃO deve estar na lista
    assert p1.id not in returned_ids
    
    # Os produtos 2 e 3 (não comprados) DEVEM estar na lista (pois são recentes/disponíveis)
    assert p2.id in returned_ids
    assert p3.id in returned_ids

def test_get_similar_products_by_price(client: TestClient, db: Session):
    """
    Testa se a busca por similares retorna produtos na mesma faixa de preço.
    """
    # --- Arrange ---
    # Produto Alvo: Preço 100.00
    target = create_random_product(db, selling_price=100.0)
    
    # Produto Similar: Preço 110.00 (Dentro dos 30%)
    similar = create_random_product(db, selling_price=110.0)
    
    # Produto Caro: Preço 200.00 (Fora dos 30%)
    expensive = create_random_product(db, selling_price=200.0)

    # --- Act ---
    # Endpoint público, sem headers
    response = client.get(f"{settings.API_V1_STR}/recommendations/product/{target.id}")

    # --- Assert ---
    assert response.status_code == 200
    data = response.json()
    returned_ids = [item["id"] for item in data]

    assert target.id not in returned_ids # Não deve recomendar a si mesmo
    assert similar.id in returned_ids    # Deve recomendar o similar
    assert expensive.id not in returned_ids # Não deve recomendar o muito caro