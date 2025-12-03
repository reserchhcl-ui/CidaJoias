# tests/unit/test_email_service.py

from unittest.mock import MagicMock
from app.services.email_service import EmailService
from app.models import User, Order

def test_send_order_confirmation_format():
    # Arrange
    service = EmailService()
    # Mock do método interno de envio para capturar os argumentos
    service.send_email = MagicMock()
    
    # CORREÇÃO: Removemos o campo 'name', pois ele não existe no modelo User
    user = User(email="test@example.com") 
    
    # Usamos Decimal ou float para total_amount conforme definido no modelo (Decimal é o padrão)
    # Mas para o mock do teste, o Python aceita float se não estivermos salvando no banco.
    order = Order(id=123, total_amount=150.50)
    
    # Act
    service.send_order_confirmation(user, order)
    
    # Assert
    service.send_email.assert_called_once()
    args = service.send_email.call_args[0] # (to, subject, content)
    
    assert args[0] == "test@example.com"
    assert "Pedido #123" in args[1] # Subject
    assert "R$ 150.50" in args[2] # Content