# NOVO ARQUIVO: tests/unit/test_pricing_engine.py

import pytest
from unittest.mock import MagicMock
from decimal import Decimal

from app.services.pricing_engine import PricingEngine
from app.models import Product, Discount
from app.crud import *
def test_get_current_price_returns_selling_price_when_no_discount(mocker):
    """
    Testa o 'caminho feliz' mais simples: se não há desconto ativo,
    o motor deve retornar o preço de venda padrão do produto.
    """
    # --- Arrange ---
    mock_db = MagicMock()
    
    mock_product = Product(
        id=1,
        selling_price=Decimal("100.00"),
        cost_price=Decimal("50.00")
    )
    
    # Configuramos o mock do CRUD de desconto para retornar NADA (None)
    mocker.patch("app.crud.discount.get_active_for_product", return_value=None)
    
    pricing_engine = PricingEngine(db=mock_db)
    
    # --- Act ---
    current_price = pricing_engine.get_current_price_for_product(product=mock_product)
    
    # --- Assert ---
    assert current_price == mock_product.selling_price
    assert current_price == Decimal("100.00")
    # Verificamos se a função mockada foi chamada corretamente
    crud_discount.discount.get_active_for_product.assert_called_once_with(db=mock_db, product_id=mock_product.id)

def test_get_current_price_returns_discount_price_when_discount_is_active(mocker):
    """
    Testa o cenário principal: se há um desconto ativo, o motor
    deve retornar o preço com desconto, ignorando o preço de venda.
    """
    # --- Arrange ---
    mock_db = MagicMock()
    
    mock_product = Product(
        id=1,
        selling_price=Decimal("100.00"),
        cost_price=Decimal("50.00")
    )
    
    mock_active_discount = Discount(
        product_id=1,
        discount_price=Decimal("79.90")
    )
    
    # Configuramos o mock do CRUD para retornar o nosso desconto ativo
    mocker.patch("app.crud.discount.get_active_for_product", return_value=mock_active_discount)
    
    pricing_engine = PricingEngine(db=mock_db)
    
    # --- Act ---
    current_price = pricing_engine.get_current_price_for_product(product=mock_product)
    
    # --- Assert ---
    assert current_price == mock_active_discount.discount_price
    assert current_price == Decimal("79.90")
    assert current_price != mock_product.selling_price
    crud_discount.discount.get_active_for_product.assert_called_once_with(db=mock_db, product_id=mock_product.id)