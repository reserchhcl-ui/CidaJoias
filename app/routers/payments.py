# app/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException, status,BackgroundTasks
from sqlalchemy.orm import Session
from .. import schemas, auth, crud
from ..database import get_db
from ..services.payment_service import PaymentService
from ..services.email_service import email_service

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

def get_payment_service(db: Session = Depends(get_db)):
    return PaymentService(db)

@router.post("/process", response_model=schemas.PaymentResponse)
def process_payment(
    payment_request: schemas.PaymentRequest,
    background_tasks: BackgroundTasks, # <--- Injeção
    service: PaymentService = Depends(get_payment_service),
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user) 
):
    # Processa o pagamento
    response = service.process_payment(payment_request)
    
    # Se aprovado, notifica o usuário
    if response.status == "approved":
        # Precisamos recarregar o pedido para pegar o user_id e então o User
        order = crud.order.get(db, id=payment_request.order_id)
        user = crud.user.get(db, id=order.user_id)
        
        background_tasks.add_task(
            email_service.send_payment_confirmation,
            user=user,
            order=order
        )
        
    return response