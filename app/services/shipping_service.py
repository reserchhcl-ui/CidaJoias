# app/services/shipping_service.py

from sqlalchemy.orm import Session
from decimal import Decimal
from typing import List
from .. import models, schemas, crud
from .pricing_engine import PricingEngine

STD_BOX_S = {"name": "Caixa P", "weight": 0.1, "dims": "16x11x6"} # 100g de papelão
STD_BOX_M = {"name": "Caixa M", "weight": 0.2, "dims": "24x15x10"} # Para pedidos grandes

class ShippingService:
    def __init__(self, db: Session):
        self.db = db
        self.pricing_engine = PricingEngine(db)

    def calculate_shipping(
            self, 
            zip_code: str, 
            items: List[schemas.CheckoutItem]
        ) -> List[schemas.ShippingOption]:
            """
            Calcula frete considerando o peso dos produtos + peso da embalagem.
            """
            products_weight = 0.0
            total_items_count = 0
            total_cart_value = Decimal("0.00")
            
            # 1. Calcular Totais
            for item in items:
                product = crud.product.get(self.db, id=item.product_id)
                if not product:
                    continue
                
                qty = item.quantity
                products_weight += (product.weight * qty)
                total_items_count += qty
                
                unit_price = self.pricing_engine.get_current_price_for_product(product=product)
                total_cart_value += (unit_price * qty)

            # 2. Seleção de Embalagem (Heurística Simples)
            # Se tivermos mais de 20 itens ou peso > 1kg, usamos a Caixa M.
            # Caso contrário, usamos a Caixa P (padrão para joias).
            if total_items_count > 20 or products_weight > 1.0:
                selected_box = STD_BOX_M
            else:
                selected_box = STD_BOX_S

            # Peso Final = Produtos + Embalagem
            final_weight = products_weight + selected_box["weight"]

            # 3. Cálculo Mock (Simulação de Tabela de Preço)
            # Na vida real, aqui chamaríamos a API dos Correios passando `final_weight` e `selected_box['dims']`
            options = []

            # PAC: Base R$ 18,00 + R$ 1,50 por kg excedente
            price_pac = 18.00 + (1.50 * final_weight)
            options.append(schemas.ShippingOption(
                name=f"PAC ({selected_box['name']})",
                price=round(price_pac, 2),
                estimated_days=7
            ))

            # SEDEX: Base R$ 35,00 + R$ 3,00 por kg excedente
            price_sedex = 35.00 + (3.00 * final_weight)
            options.append(schemas.ShippingOption(
                name=f"SEDEX ({selected_box['name']})",
                price=round(price_sedex, 2),
                estimated_days=3
            ))

            # Regra de Frete Grátis
            if total_cart_value > Decimal("500.00"):
                options.append(schemas.ShippingOption(
                    name="Frete Grátis (Promoção)",
                    price=0.0,
                    estimated_days=10
                ))

            return options