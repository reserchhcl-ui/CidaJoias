from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from .. import models, schemas
from ..crud import crud_product, crud_order # Importamos nossas ferramentas
from .pricing_engine import PricingEngine

class OrderCreationError(ValueError):
    """Exceção customizada para erros na criação de pedidos."""
    pass

class OrderService:
    def __init__(self, db: Session):
        # O serviço recebe a sessão do banco ao ser instanciado
        self.db = db
        self.pricing_engine = PricingEngine(db)

    def create_customer_order(self, user: models.User, checkout_request: schemas.CheckoutRequest) -> models.Order:
        """
        Orquestra a criação de uma nova encomenda, contendo toda a lógica de negócio.
        """
        # A transação é controlada aqui, na camada de serviço!
        try:
            # --- FASE 1: VALIDAÇÃO DA LÓGICA DE NEGÓCIO ---
            products_to_process = []
            for item in checkout_request.items:
                # Usamos a ferramenta do crud_product para pegar e "travar" o produto
                product = crud_product.get_product_for_update(self.db, product_id=item.product_id)

                if not product:
                    raise ValueError(f"Produto com id {item.product_id} não encontrado.")

                available_stock = product.stock_quantity - product.on_loan_quantity
                if item.quantity > available_stock:
                    raise ValueError(f"Estoque insuficiente para '{product.name}'. Pedido: {item.quantity}, Disponível: {available_stock}")
                
                products_to_process.append({"product": product, "quantity_sold": item.quantity})

            # --- FASE 2: PERSISTÊNCIA (USANDO AS FERRAMENTAS CRUD) ---
            # Se todas as validações passaram, começamos a alterar o banco.
            
            # Criar o pedido principal
            db_order = crud_order.create_order(self.db, user_id=user.id, status="processing")

            # Criar os itens e atualizar o estoque
            for data in products_to_process:
                product = data["product"]
                quantity_sold = data["quantity_sold"]
                price_at_purchase = self.pricing_engine.get_current_price_for_product(product=product)
                # Criar o item do pedido
                crud_order.create_order_item(
                    self.db,
                    order_id=db_order.id,
                    product_id=product.id,
                    quantity=quantity_sold,
                    price_at_purchase=price_at_purchase 
                )
                
                # Deduzir do inventário
                crud_product.decrease_stock(self.db, product=product, quantity=quantity_sold)

            # Se chegamos até aqui sem erros, confirmamos tudo.
            self.db.commit()
            self.db.refresh(db_order)
            return db_order

        except Exception as e:
            # 2.4 Em caso de QUALQUER erro, reverter tudo
            self.db.rollback()
            # Logar o erro 'e' aqui seria uma boa prática em produção
            raise OrderCreationError(f"An unexpected error occurred while creating the order: {e}")