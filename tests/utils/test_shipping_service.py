# tests/unit/test_shipping_service.py

import pytest
from unittest.mock import MagicMock
from decimal import Decimal
from app.services.shipping_service import ShippingService
from app.schemas import CheckoutItem

def test_shipping_calculation_small_package(mocker):
    """Testa cálculo para pacote pequeno (PAC e SEDEX)."""
    # Arrange
    mock_db = MagicMock()
    mock_pricing_engine = MagicMock()
    # Mock do produto (preço 100, sem peso pois é heurístico)
    mock_product = MagicMock()
    
    mocker.patch("app.services.shipping_service.crud.product.get", return_value=mock_product)
    # Mock do pricing engine para retornar preço unitário
    mock_pricing_engine.get_current_price_for_product.return_value = Decimal("100.00")
    
    service = ShippingService(db=mock_db)
    # Injeta o mock do pricing engine manualmente (hack de teste unitário rápido)
    service.pricing_engine = mock_pricing_engine

    items = [CheckoutItem(product_id=1, quantity=2)] # 2 itens * 50g = 100g + 100g caixa = 200g total

    # Act
    options = service.calculate_shipping("12345-678", items)

    # Assert
    # Peso total estimado: 0.2kg. É < 1kg, então deve ser preço base.
    pac_option = next(o for o in options if "PAC" in o.name)
    assert pac_option.price == 20.00 # Base do PAC

    sedex_option = next(o for o in options if "SEDEX" in o.name)
    assert sedex_option.price == 35.00 # Base do SEDEX

def test_shipping_calculation_heavy_package_logic(mocker):
    """Testa se o frete aumenta com o peso excedente (Heurística > 1kg)."""
    mock_db = MagicMock()
    mock_product = MagicMock()
    mocker.patch("app.services.shipping_service.crud.product.get", return_value=mock_product)
    
    service = ShippingService(db=mock_db)
    service.pricing_engine = MagicMock()
    service.pricing_engine.get_current_price_for_product.return_value = Decimal("10.00")

    # 40 itens * 0.05kg = 2.0kg + 0.1kg caixa = 2.1kg Total
    # Excedente = 1.1kg
    items = [CheckoutItem(product_id=1, quantity=40)]

    # Act
    options = service.calculate_shipping("12345-678", items)

    # Assert
    # PAC: 20.00 + (1.1 * 5.0) = 20.00 + 5.50 = 25.50
    pac_option = next(o for o in options if "PAC" in o.name)
    
    # CORREÇÃO: Ajustado de 26.00 para 25.50 para casar com a constante BOX_WEIGHT=0.1
    assert pac_option.price == 25.50