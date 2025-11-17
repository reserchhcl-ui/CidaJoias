# NOVO ARQUIVO: tests/unit/test_sales_case_service.py

import pytest
from unittest.mock import MagicMock
from faker import Faker

from app.services.sales_case_service import SalesCaseService, SalesCaseLogicError
from app.schemas import SalesCaseCreate, SalesCaseItemCreate
from app.models import UserRole

fake = Faker()

def test_create_new_case_insufficient_stock(mocker):
    """
    Testa se o SalesCaseService levanta uma exceção SalesCaseLogicError
    quando se tenta criar um estojo com um produto que não tem estoque disponível.
    """
    # --- 1. Arrange (Preparação) ---
    
    # Mock do banco de dados (não precisamos de um DB real)
    mock_db = MagicMock()

    # Criar dados de entrada falsos
    sales_rep_id = 1
    product_id_with_no_stock = 101
    
    case_create_schema = SalesCaseCreate(
        sales_rep_id=sales_rep_id,
        loan_duration_days=30,
        items=[SalesCaseItemCreate(product_id=product_id_with_no_stock, quantity=5)]
    )

    # Mock dos objetos que seriam retornados pelo CRUD
    mock_sales_rep = MagicMock()
    mock_sales_rep.role = UserRole.SALES_REP

    mock_product = MagicMock()
    mock_product.name = "Anel de Prata"
    mock_product.stock_quantity = 10
    mock_product.on_loan_quantity = 8 # <-- Estoque disponível: 10 - 8 = 2
    # A requisição pede 5, o que deve causar o erro.
    
    # Configurar os Mocks do CRUD para retornar nossos objetos falsos
    # `mocker.patch` intercepta a chamada à função real e a substitui
    mocker.patch("app.services.sales_case_service.crud.user.get", return_value=mock_sales_rep)
    mocker.patch("app.services.sales_case_service.crud.crud_product.get_product", return_value=mock_product)

    # Instanciar o nosso serviço com o mock do DB
    service = SalesCaseService(db=mock_db)

    # --- 2. Act & 3. Assert (Ação e Verificação) ---
    
    # Verificamos se o código DENTRO do 'with' levanta a exceção esperada
    with pytest.raises(SalesCaseLogicError) as excinfo:
        service.create_new_case(case_create=case_create_schema)

    # Opcional, mas recomendado: verificar se a mensagem de erro contém o texto esperado
    assert "Insufficient available stock" in str(excinfo.value)
    
    # Garantir que o commit nunca foi chamado, provando a atomicidade
    mock_db.commit.assert_not_called()
    mock_db.rollback.assert_not_called() # Não deve ter rollback porque o erro acontece antes de escrever