# app/routers/payments.py

from fastapi import APIRouter, Depends, status,Header,HTTPException,Request
from sqlalchemy.orm import Session
from .. import schemas, auth, models
from ..database import get_db
from ..services.payment_service import PaymentService
import json,hmac,hashlib
from app.core.config import settings
router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)
WEBHOOK_SECRET = "minha_chave_secreta_do_banco_123"
def get_payment_service(db: Session = Depends(get_db)):
    return PaymentService(db)

@router.post("/process", response_model=schemas.PaymentResponse)
def process_credit_card(
    payment_request: schemas.PaymentRequest,
    # Header Opcional, mas recomendado
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    service: PaymentService = Depends(get_payment_service),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Processa pagamento. Suporta Idempotência para evitar cobrança dupla.
    """
    order = db.query(models.Order).filter(
        models.Order.id == payment_request.order_id, # Usando payment_request
        models.Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Pedido não encontrado ou não pertence a este utilizador."
        )

    # Adicionalmente, verificar se o pedido já não foi pago.
    if order.payment_status == schemas.PaymentStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este pedido já foi pago."
        )
    
    # 1. Checagem de Idempotência
    if idempotency_key:
        cached = db.query(models.IdempotencyKey).filter_by(key=idempotency_key).first()
        if cached:
            # Retorna a resposta salva anteriormente imediatamente
            return json.loads(cached.response_json)

    # 2. Processa Pagamento
    response = service.process_credit_card(payment_request, user_id=current_user.id)
    
    # 3. Salva Chave de Idempotência (Se fornecida)
    if idempotency_key:
        # Convertemos o objeto Pydantic para JSON para salvar no banco
        resp_json = response.model_dump_json()
        new_key = models.IdempotencyKey(key=idempotency_key, response_json=resp_json)
        db.add(new_key)
        db.commit()
        
    return response

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

# --- SIMULAÇÃO (WEBHOOK) ---
@router.post("/pix/webhook-mock", status_code=status.HTTP_200_OK)
async def mock_pix_callback( # <-- Marcar como async
    request: Request, # <-- Injetar o objeto Request
    webhook_in: schemas.PixWebhookMock,
    x_signature: str | None = Header(None), 
    service: PaymentService = Depends(get_payment_service)
):
    # 1. Pegamos o corpo BRUTO da mensagem
    raw_body = await request.body()
    
    # 2. Geramos o hash esperado usando a nossa SECRET e o corpo bruto
    expected_signature = hmac.new(
        key=WEBHOOK_SECRET.encode(),
        msg=raw_body, # Usar o corpo bruto
        digestmod=hashlib.sha256
    ).hexdigest()

    # 3. Em produção, esta verificação é OBRIGATÓRIA
    if not x_signature or not hmac.compare_digest(expected_signature, x_signature):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Assinatura do webhook inválida."
        )
    
    # Apenas se a assinatura for válida, continuamos a usar o payload validado pelo Pydantic
    return service.mock_webhook_callback(webhook_in)