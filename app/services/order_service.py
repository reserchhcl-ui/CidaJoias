# app/services/order_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import datetime, timezone
from .. import models, schemas, crud
from .pricing_engine import PricingEngine

class OrderCreationError(ValueError):
    pass

class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.pricing_engine = PricingEngine(db)

    def _validate_and_apply_coupon(self, coupon_code: str, subtotal: Decimal) -> tuple[models.Coupon, Decimal]:
        """
        Valida o cupom e retorna o objeto Coupon e o valor monetário do desconto.
        """
        coupon = crud.coupon.get_by_code(self.db, code=coupon_code)
        
        if not coupon:
            raise OrderCreationError(f"Cupom '{coupon_code}' não encontrado.")
        
        if not coupon.is_active:
            raise OrderCreationError("Este cupom foi desativado.")
            
        # Validade de Data
        now = datetime.now(timezone.utc)
        expiration = coupon.expiration_date
        if expiration.tzinfo is None:
            expiration = expiration.replace(tzinfo=timezone.utc)
            
        if expiration < now:
            raise OrderCreationError("Este cupom expirou.")
            
        # Limite de uso
        if coupon.max_uses is not None and coupon.current_uses >= coupon.max_uses:
            raise OrderCreationError("Este cupom atingiu o limite máximo de usos.")
            
        # Valor mínimo
        if subtotal < coupon.min_purchase_amount:
            raise OrderCreationError(f"O valor mínimo para este cupom é R$ {coupon.min_purchase_amount:.2f}")

        # Calcular desconto
        discount_amount = Decimal(0)
        if coupon.discount_type == models.CouponType.PERCENTAGE:
            discount_amount = subtotal * (coupon.discount_value / 100)
        else:
            discount_amount = coupon.discount_value
            
        # Garantir que desconto não é maior que o subtotal
        if discount_amount > subtotal:
            discount_amount = subtotal
            
        return coupon, discount_amount

    def create_customer_order(self, user: models.User, checkout_request: schemas.CheckoutRequest) -> models.Order:
        """
        Orquestra a criação de uma nova encomenda com suporte a CUPONS.
        """
        try:
            # 1. Preparação e validação de estoque
            products_to_process = []
            calculated_subtotal = Decimal(0)

            for item in checkout_request.items:
                # Lock pessimista no produto
                product = crud.product.get_for_update(self.db, product_id=item.product_id)
                if not product:
                    raise ValueError(f"Produto {item.product_id} não encontrado.")

                available = product.stock_quantity - product.on_loan_quantity
                if item.quantity > available:
                    raise ValueError(f"Estoque insuficiente para '{product.name}'.")
                
                # Preço unitário atual (com promoções de produto, se houver)
                unit_price = self.pricing_engine.get_current_price_for_product(product=product)
                line_total = unit_price * item.quantity
                calculated_subtotal += line_total
                
                products_to_process.append({
                    "product": product,
                    "quantity": item.quantity,
                    "price": unit_price
                })

            # 2. Processamento do Cupom (Se houver)
            applied_coupon = None
            discount_amount = Decimal(0)

            if checkout_request.coupon_code:
                applied_coupon, discount_amount = self._validate_and_apply_coupon(
                    checkout_request.coupon_code, 
                    calculated_subtotal
                )

            final_total = calculated_subtotal - discount_amount

            # 3. Criação do Pedido (Agora com os valores calculados)
            db_order = models.Order(
                user_id=user.id,
                status="processing",
                subtotal=calculated_subtotal,
                applied_discount=discount_amount,
                total_amount=final_total,
                coupon_id=applied_coupon.id if applied_coupon else None
            )
            self.db.add(db_order)
            self.db.flush() # Gera o ID do pedido

            # 4. Criação dos Itens e Baixa de Estoque
            for p_data in products_to_process:
                crud.order.create_order_item(
                    self.db,
                    order_id=db_order.id,
                    product_id=p_data["product"].id,
                    quantity=p_data["quantity"],
                    price_at_purchase=p_data["price"]
                )
                crud.product.decrease_stock(self.db, product=p_data["product"], quantity=p_data["quantity"])

            # 5. Incrementar uso do cupom (Se usado)
            if applied_coupon:
                crud.coupon.increment_usage(self.db, coupon_id=applied_coupon.id)

            self.db.commit()
            self.db.refresh(db_order)
            return db_order

        except Exception as e:
            self.db.rollback()
            # Converter ValueErrors genéricos para nossa Exception específica para o Router capturar
            raise OrderCreationError(str(e))