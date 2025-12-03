# tests/integration/test_address_logic.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.crud import address as crud_address
from app import schemas
from tests.utils.user import create_random_user

def test_ensure_single_default_address(db: Session):
    """
    Testa se ao criar um segundo endereço 'default', o primeiro deixa de ser default.
    """
    # Arrange
    user = create_random_user(db)
    
    addr1_in = schemas.AddressCreate(
        name="Casa", recipient_name="Eu", zip_code="12345678", street="Rua A", 
        number="1", neighborhood="Bairro", city="Cidade", state="SP", is_default=True
    )
    addr1 = crud_address.create(db, obj_in=addr1_in, user_id=user.id)
    
    # Verifica estado inicial
    assert addr1.is_default is True

    # Act - Cria segundo endereço também como default
    addr2_in = schemas.AddressCreate(
        name="Trabalho", recipient_name="Eu", zip_code="87654321", street="Rua B", 
        number="2", neighborhood="Centro", city="Cidade", state="SP", is_default=True
    )
    addr2 = crud_address.create(db, obj_in=addr2_in, user_id=user.id)

    # Assert
    db.refresh(addr1)
    db.refresh(addr2)
    
    assert addr2.is_default is True  # O novo deve ser o padrão
    assert addr1.is_default is False # O antigo deve ter sido desmarcado automaticamente