# app/services/shipping_service.py

from sqlalchemy.orm import Session
from decimal import Decimal
from typing import List
from .. import models, schemas, crud
from .pricing_engine import PricingEngine

# --- CONSTANTES DE NEGÓCIO ---
AVG_ITEM_WEIGHT_KG = 0.05 # 50g por peça (média conservadora para anéis/brincos/colares)
BOX_WEIGHT_KG = 0.1       # 100g da caixa de papelão padrão

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
        Calcula frete usando heurística de quantidade.
        Evita a necessidade de cadastrar peso produto a produto.
        """
        total_items_count = 0
        total_cart_value = Decimal("0.00")
        
        # 1. Calcular Totais (Apenas quantidade e valor)
        for item in items:
            # Precisamos do produto apenas para o preço, não mais para o peso
            product = crud.product.get(self.db, id=item.product_id)
            if not product:
                continue
            
            qty = item.quantity
            total_items_count += qty
            
            unit_price = self.pricing_engine.get_current_price_for_product(product=product)
            total_cart_value += (unit_price * qty)

        # 2. Cálculo do Peso Estimado
        # Peso = (Qtd * Peso Médio) + Caixa
        estimated_weight = (total_items_count * AVG_ITEM_WEIGHT_KG) + BOX_WEIGHT_KG

        # 3. Definição da Tabela de Preços (Simulação)
        # Na prática, semi-joias raramente passam de 1kg (20 peças = 1kg + caixa).
        # Então a variação de preço é mínima.
        
        options = []

        # PAC: Base R$ 20,00 (cobre até 1kg) + Adicional se passar muito
        # Simplificação: Se peso < 1kg, preço base. Se maior, pequena taxa.
        base_pac = 20.00
        if estimated_weight > 1.0:
            base_pac += (estimated_weight - 1.0) * 5.0 # R$ 5 por kg extra
            
        options.append(schemas.ShippingOption(
            name="PAC",
            price=round(base_pac, 2),
            estimated_days=7
        ))

        # SEDEX: Base R$ 35,00 (cobre até 1kg)
        base_sedex = 35.00
        if estimated_weight > 1.0:
            base_sedex += (estimated_weight - 1.0) * 10.0 # R$ 10 por kg extra

        options.append(schemas.ShippingOption(
            name="SEDEX",
            price=round(base_sedex, 2),
            estimated_days=3
        ))

        # Regra de Frete Grátis (Manteve-se a regra de valor, que é a mais importante)
        if total_cart_value > Decimal("500.00"):
            options.append(schemas.ShippingOption(
                name="Frete Grátis",
                price=0.0,
                estimated_days=10
            ))

        return options