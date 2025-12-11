# app/services/payment_service.py

import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from .. import models, schemas, crud
from ..models import PaymentStatus
from datetime import datetime, timedelta, timezone
class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def process_payment(self, payment_in: schemas.PaymentRequest, user_id: int) -> schemas.PaymentResponse:
        """
        Processa o pagamento de um pedido.
        Lógica Mock:
        - Cartão final '1': Aprovado
        - Cartão final '2': Recusado (Saldo Insuficiente)
        - Outros: Aprovado
        """
        # 1. Buscar Pedido
        order = crud.order.get(self.db, id=payment_in.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # 2. Segurança: Verificar se o pedido pertence ao usuário
        if order.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to pay for this order")
        
        # 3. Validar Status Atual
        if order.payment_status == PaymentStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Order is already paid")

        if order.status == "canceled":
             raise HTTPException(status_code=400, detail="Cannot pay for a canceled order")

        # 4. Simulação do Gateway (Lógica de Mock)
        transaction_id = str(uuid.uuid4())
        card_number = payment_in.card_info.number if payment_in.card_info else ""
        
        # Regra de Mock para testes do Frontend
        if card_number.endswith("2"):
            new_payment_status = PaymentStatus.FAILED
            message = "Transaction declined: Insufficient funds (Mock)"
            # Não mudamos o status logístico, apenas o financeiro
        else:
            new_payment_status = PaymentStatus.APPROVED
            message = "Payment authorized successfully"
            # Atualiza status logístico para indicar que pode ser separado
            order.status = "paid" 

        # 5. Persistência (Atomic Update)
        try:
            order.payment_status = new_payment_status
            order.transaction_id = transaction_id
            order.payment_method = payment_in.payment_method
            
            self.db.add(order)
            self.db.commit()
            self.db.refresh(order)
            
            return schemas.PaymentResponse(
                order_id=order.id,
                status=new_payment_status.value, # Retorna string ("approved", "failed")
                transaction_id=transaction_id,
                message=message
            )
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Payment processing error: {str(e)}")
    
    def create_pix_payment(self, pix_in: schemas.PixRequest, user_id: int) -> schemas.PixResponse:
            """
            Gera uma intenção de pagamento PIX (Copia e Cola).
            O status inicial será PENDING.
            """
            # 1. Buscar e Validar Pedido
            order = crud.order.get(self.db, id=pix_in.order_id)
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")
            
            if order.user_id != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")
                
            if order.payment_status == PaymentStatus.APPROVED:
                raise HTTPException(status_code=400, detail="Order already paid")

            # 2. Gerar "Copia e Cola" Mock
            # Na vida real, chamaríamos a API do Banco/Gateway aqui (Gerencianet, Pagar.me, etc)
            pix_copy_paste = f"00020126580014BR.GOV.BCB.PIX0136{str(uuid.uuid4())}5204000053039865802BR5913Cida Joias6008Brasilia62070503***6304"
            expiration = datetime.now(timezone.utc) + timedelta(minutes=30)

            # 3. Atualizar Pedido
            try:
                order.payment_method = "pix"
                order.payment_status = PaymentStatus.PENDING # Fica aguardando pagamento
                order.transaction_id = str(uuid.uuid4()) # ID da transação no banco
                
                self.db.add(order)
                self.db.commit()
                self.db.refresh(order)
                
                return schemas.PixResponse(
                    order_id=order.id,
                    status=order.payment_status.value,
                    qr_code=pix_copy_paste,
                    expires_at=expiration,
                    message="PIX gerado com sucesso. Aguardando pagamento."
                )
                
            except Exception as e:
                self.db.rollback()
                raise HTTPException(status_code=500, detail=str(e))

    def mock_pix_webhook(self, webhook_in: schemas.PixWebhookMock):
        """
        Simula o recebimento de confirmação do banco.
        Use isso para testar a mudança de status 'ao vivo'.
        """
        order = crud.order.get(self.db, id=webhook_in.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if webhook_in.action == "pay":
            order.payment_status = PaymentStatus.APPROVED
            order.status = "paid" # Status logístico
        elif webhook_in.action == "expire":
            order.payment_status = PaymentStatus.FAILED
            order.status = "canceled"
            
        self.db.add(order)
        self.db.commit()
        return {"message": f"Order {order.id} updated to {order.payment_status}"}    