# app/services/payment_service.py

import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from .. import models, schemas, crud
from ..models import PaymentStatus,OrderStatus
from datetime import datetime, timedelta, timezone
class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def _get_valid_order(self, order_id: int, user_id: int = None) -> models.Order:
        """Helper para buscar e validar pedido."""
        order = crud.order.get(self.db, id=order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Se user_id for fornecido, valida a posse (segurança)
        if user_id and order.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to pay for this order")
            
        if order.payment_status == PaymentStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Order already paid")
            
        if order.status == "canceled":
             raise HTTPException(status_code=400, detail="Cannot pay for a canceled order")
             
        return order
    
    def _validate_stock_and_lock(self, order_id: int):
            """
            Valida se há estoque suficiente para todos os itens.
            Usa 'with_for_update()' para BLOQUEAR as linhas dos produtos no banco
            impedindo que outros pagamentos alterem esse estoque simultaneamente.
            """
            # Recarrega o pedido para garantir dados frescos
            order = crud.order.get(self.db, id=order_id)
            
            for item in order.items:
                # Query travando a linha do produto específico
                product = self.db.query(models.Product)\
                    .filter(models.Product.id == item.product_id)\
                    .with_for_update()\
                    .first()

                if not product:
                    raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
                
                # Cálculo: Estoque Físico - Consignado
                available = product.stock_quantity - product.on_loan_quantity
                
                if available < item.quantity:
                    raise HTTPException(
                        status_code=409, # Conflict
                        detail=f"Out of stock for product '{product.name}'. Requested: {item.quantity}, Available: {available}"
                    )
            return order

    def process_credit_card(self, payment_in: schemas.PaymentRequest, user_id: int) -> schemas.PaymentResponse:
        # 1. Inicia Transação
        try:
            # 2. Valida e TRAVA o estoque (Critical Section)
            order = self._validate_stock_and_lock(payment_in.order_id)
            
            # (Validações de usuário/pagamento duplicado já existentes...)
            if order.user_id != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")
            if order.payment_status == PaymentStatus.APPROVED:
                raise HTTPException(status_code=400, detail="Already paid")

            # 3. Simula Gateway
            transaction_id = str(uuid.uuid4())
            card_number = ""
            if payment_in.card_info:
                card_number = payment_in.card_info.number
            
            # Se for cartão, card_info é obrigatório. Se veio vazio, é erro.
            if not card_number:
                 raise HTTPException(status_code=400, detail="Credit Card info is missing")
            # ---------------------
            
            if card_number.endswith("2"):
                # Falhou: Não mexe no estoque, só registra falha
                order.payment_status = PaymentStatus.FAILED
                message = "Transaction declined: Insufficient funds"
            else:
                # 4. Aprovou: BAIXA O ESTOQUE AGORA
                order.payment_status = PaymentStatus.APPROVED
                order.status = OrderStatus.PAID
                message = "Payment authorized"
                
                # Baixa efetiva do estoque
                for item in order.items:
                    product = self.db.query(models.Product).get(item.product_id)
                    product.stock_quantity -= item.quantity
                    self.db.add(product)

            # 5. Commit (Libera o Lock dos produtos e salva o pedido)
            order.transaction_id = transaction_id
            order.payment_method = "credit_card"
            self.db.add(order)
            self.db.commit()
            self.db.refresh(order)
            
            return schemas.PaymentResponse(
                order_id=order.id,
                status=order.payment_status.value,
                transaction_id=transaction_id,
                message=message
            )
            
        except HTTPException as he:
            self.db.rollback() # Libera o lock em caso de erro
            raise he
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    
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

    def mock_webhook_callback(self, webhook_in: schemas.PixWebhookMock):
        """
        Simula o recebimento de confirmação do banco.
        Use isso para testar a mudança de status 'ao vivo'.
        """
        order = crud.order.get(self.db, id=webhook_in.order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if webhook_in.action == "pay":
            order.payment_status = PaymentStatus.APPROVED
            order.status = OrderStatus.PAID
        elif webhook_in.action == "expire":
            order.payment_status = PaymentStatus.FAILED
            order.status = "canceled"
            
        self.db.add(order)
        self.db.commit()
        return {"message": f"Order {order.id} updated to {order.payment_status}"}    