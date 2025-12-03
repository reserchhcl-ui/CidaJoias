# NOVO ARQUIVO: app/services/payment_service.py

import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from .. import models, schemas, crud
from ..models import PaymentStatus

class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def process_payment(self, payment_in: schemas.PaymentRequest) -> schemas.PaymentResponse:
        """
        Simula o processamento de um pagamento.
        Regras de Mock (baseado no final do cartão):
        - Final '1': SUCESSO
        - Final '2': FALHA (Saldo Insuficiente)
        - Outros: SUCESSO (Padrão)
        """
        # 1. Buscar Pedido
        order = crud.order.get(self.db, id=payment_in.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.payment_status == PaymentStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Order already paid")

        # 2. Simulação do Gateway
        transaction_id = str(uuid.uuid4())
        card_number = payment_in.card_info.number if payment_in.card_info else ""
        
        # Lógica de Mock
        if card_number.endswith("2"):
            new_status = PaymentStatus.FAILED
            message = "Insufficient funds (Mock)"
        else:
            new_status = PaymentStatus.APPROVED
            message = "Payment authorized successfully"

        # 3. Atualização do Pedido (Transacional)
        try:
            order.payment_status = new_status
            order.transaction_id = transaction_id
            order.payment_method = payment_in.payment_method
            
            # Se aprovado, muda status logístico também
            if new_status == PaymentStatus.APPROVED:
                order.status = "paid_ready_to_ship"
                
            self.db.add(order)
            self.db.commit()
            self.db.refresh(order)
            
            return schemas.PaymentResponse(
                order_id=order.id,
                status=new_status.value,
                transaction_id=transaction_id,
                message=message
            )
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")