# app/services/order_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import datetime, timezone
from .. import models, schemas, crud
from .pricing_engine import PricingEngine
from ..models import OrderStatus, PaymentStatus
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
                # 1. Validações Básicas
            if not checkout_request.items:
                raise HTTPException(status_code=400, detail="Carrinho vazio")

            # 2. Loop de Cálculo e Preparação dos Itens
            # Não salvamos nada no banco ainda. Apenas calculamos na memória.
            subtotal = Decimal(0)
            items_to_save = [] # Lista temporária

            for item_req in checkout_request.items:
                product = crud.product.get(self.db, id=item_req.product_id)
                if not product:
                    raise HTTPException(status_code=404, detail=f"Produto {item_req.product_id} não encontrado")
                
                # Converter preços para Decimal para evitar erro de float
                price = Decimal(product.selling_price)
                qty = Decimal(item_req.quantity)
                
                line_total = price * qty
                subtotal += line_total

                # Guardamos os dados para criar o OrderItem depois
                items_to_save.append({
                    "product_id": product.id,
                    "quantity": item_req.quantity,
                    "price": price
                })

            # 3. Cálculo Final
            shipping = Decimal(checkout_request.shipping_cost)
            discount = Decimal(0) # Implementar lógica de cupom depois
            total_amount = subtotal + shipping - discount

            # 4. Criar o Pedido (Cabeçalho)
            db_order = models.Order(
                user_id=user.id,
                status=OrderStatus.PENDING,
                payment_status=PaymentStatus.PENDING,
                
                subtotal=subtotal,
                applied_discount=discount,
                total_amount=total_amount,
                
                # --- ADICIONE ESTAS DUAS LINHAS ---
                shipping_cost=shipping,  # Salva os 20.00 (ou o valor que vier)
                shipping_address_id=checkout_request.shipping_address_id # Salva o ID 4 para vincular o endereço
                # ----------------------------------
            )

            self.db.add(db_order)
            self.db.flush()

            # 5. Salvar os Itens (Linhas)
            for item_data in items_to_save:
                db_item = models.OrderItem(
                    order_id=db_order.id, # Linkamos com o ID gerado acima
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    price_at_purchase=item_data["price"]
                )
                self.db.add(db_item)

            # 6. Commit Final (Grava tudo no banco de verdade)
            try:
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                print(f"Erro ao commitar: {e}")
                raise HTTPException(status_code=500, detail="Erro ao salvar pedido no banco")

            # 7. Refresh para garantir o retorno correto
            # Isso recarrega o objeto do banco, trazendo os relationships (items) atualizados
            self.db.refresh(db_order)
            
            # Hack para forçar o carregamento dos items se o lazy load estiver atrapalhando
            if not db_order.items:
                print("Aviso: Itens não carregaram no refresh. Forçando query.")
                # Isso força o SQLAlchemy a buscar os itens
                _ = db_order.items 

            return db_order

        except Exception as e:
            self.db.rollback()
            # Converter ValueErrors genéricos para nossa Exception específica para o Router capturar
            raise OrderCreationError(str(e))