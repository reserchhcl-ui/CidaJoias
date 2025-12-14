# app/services/email_service.py

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings
from ..models import Order, User, OrderStatus

class EmailService:
    
    def _send_email_sync(self, to_email: str, subject: str, html_content: str):
        """Lógica interna de envio SMTP."""
        if not settings.EMAILS_ENABLED:
            print(f"--- [MOCK EMAIL] Para: {to_email} | Assunto: {subject} ---")
            return

        try:
            # Configuração da Mensagem
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_USER
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html'))

            # Conexão com Servidor
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls() # Segurança
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f"E-mail enviado com sucesso para {to_email}")
        except Exception as e:
            print(f"Falha ao enviar e-mail: {str(e)}")

    def send_order_status_update(self, order: Order, user: User, new_status: OrderStatus):
        """
        Gera o texto do e-mail baseado no novo status e envia.
        """
        subject = f"Atualização do Pedido #{order.id} - {settings.PROJECT_NAME}"
        
        # Templates simples baseados no status
        status_messages = {
            OrderStatus.SHIPPED: "Boas notícias! Seu pedido foi <b>ENVIADO</b> e está a caminho.",
            OrderStatus.DELIVERED: "Seu pedido foi <b>ENTREGUE</b>! Esperamos que ame suas joias.",
            OrderStatus.CANCELLED: "Seu pedido foi <b>CANCELADO</b>. Se houve cobrança, o estorno será processado.",
            OrderStatus.PROCESSING: "Seu pedido está sendo <b>PROCESSADO</b> e separado com carinho.",
            OrderStatus.PAID: "Pagamento confirmado! Estamos preparando seu pedido."
        }
        
        message_body = status_messages.get(new_status, f"O status do seu pedido mudou para: {new_status.value}")

        # HTML Básico
        html_content = f"""
        <html>
            <body>
                <h2>Olá, {user.name}!</h2>
                <p>{message_body}</p>
                <hr>
                <p><b>Detalhes do Pedido:</b> #{order.id}</p>
                <p><b>Valor Total:</b> R$ {order.total_amount}</p>
                <br>
                <p>Obrigado por escolher a Cida Joias!</p>
            </body>
        </html>
        """

        self._send_email_sync(user.email, subject, html_content)

# Instância global
email_service = EmailService()