# app/routers/payments.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from .. import schemas, auth, models
from ..database import get_db
from ..services.payment_service import PaymentService

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

def get_payment_service(db: Session = Depends(get_db)):
    return PaymentService(db)

@router.post("/process", response_model=schemas.PaymentResponse, status_code=status.HTTP_200_OK)
def process_payment(
    payment_request: schemas.PaymentRequest,
    service: PaymentService = Depends(get_payment_service),
    current_user: models.User = Depends(auth.get_current_user) # Exige login
):
    """
    Processa o pagamento de um pedido.
    
    Simulação:
    - Use cartão final '1' para aprovar.
    - Use cartão final '2' para reprovar.
    """
    return service.process_payment(payment_request, user_id=current_user.id)

# --- PIX ---
@router.post("/pix", response_model=schemas.PixResponse)
def generate_pix(
    pix_request: schemas.PixRequest,
    service: PaymentService = Depends(get_payment_service),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Gera o código PIX Copia e Cola.
    O pedido ficará como PENDING.
    """
    return service.create_pix_payment(pix_request, user_id=current_user.id)

# --- SIMULAÇÃO DE WEBHOOK (DEV ONLY) ---
@router.post("/pix/webhook-mock", status_code=status.HTTP_200_OK)
def mock_pix_callback(
    webhook_in: schemas.PixWebhookMock,
    service: PaymentService = Depends(get_payment_service),
    # Na vida real, isso seria protegido por IP ou Assinatura Digital do banco
    # Aqui deixamos aberto ou exigimos admin para teste
):
    """
    Simula o banco avisando que o PIX foi pago.
    Payload: { "order_id": 123, "action": "pay" }
    """
    return service.mock_pix_webhook(webhook_in)