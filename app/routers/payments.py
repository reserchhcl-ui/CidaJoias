# app/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, auth
from ..database import get_db
from ..services.payment_service import PaymentService

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

def get_payment_service(db: Session = Depends(get_db)):
    return PaymentService(db)

@router.post("/process", response_model=schemas.PaymentResponse)
def process_payment(
    payment_request: schemas.PaymentRequest,
    service: PaymentService = Depends(get_payment_service),
    # Na vida real, verificariamos se o user é dono do pedido, 
    # mas o serviço valida o ID do pedido.
    current_user = Depends(auth.get_current_user) 
):
    """
    Processa o pagamento de um pedido.
    Use cartão final '1' para SUCESSO e '2' para FALHA.
    """
    return service.process_payment(payment_request)