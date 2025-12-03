# NOVO ARQUIVO: app/services/email_service.py

import logging
from .. import models

# Configuração básica de log para simular o envio
logger = logging.getLogger("uvicorn")

class EmailService:
    def __init__(self):
        self.sender = "noreply@cidajoias.com"

    def send_email(self, to: str, subject: str, content: str):
        """
        Simula o envio de um e-mail (Log no console).
        Em produção, aqui entraria a lib aiosmtplib ou boto3.
        """
        logger.info(f"--- [MOCK EMAIL SENT] ---")
        logger.info(f"To: {to}")
        logger.info(f"From: {self.sender}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {content}")
        logger.info(f"-------------------------")

    def send_order_confirmation(self, user: models.User, order: models.Order):
        subject = f"Cida Joias - Pedido #{order.id} Recebido!"
        content = f"""
        Olá, {user.email}!
        
        Recebemos seu pedido #{order.id}.
        Total: R$ {order.total_amount:.2f}
        
        Estamos aguardando a confirmação do pagamento.
        """
        self.send_email(user.email, subject, content)

    def send_payment_confirmation(self, user: models.User, order: models.Order):
        subject = f"Cida Joias - Pagamento Aprovado (Pedido #{order.id})"
        content = f"""
        Tudo certo, {user.email}!
        
        O pagamento do seu pedido #{order.id} foi aprovado.
        Em breve enviaremos o código de rastreio.
        """
        self.send_email(user.email, subject, content)

# Singleton
email_service = EmailService()