# ARQUIVO: app/services/pricing_engine.py

from sqlalchemy.orm import Session
from decimal import Decimal
from typing import List, Dict
from datetime import datetime, timezone
from .. import models

class PricingEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_current_price_for_product(self, *, product: models.Product) -> Decimal:
        """Lógica unitária (mantida para uso individual)"""
        # Nota: Idealmente, usaríamos o crud.discount aqui, mas para performance, 
        # a lógica em lote abaixo é preferível.
        from ..crud import discount # Importação local para evitar ciclo
        active_discount = discount.get_active_for_product(db=self.db, product_id=product.id)
        
        if active_discount:
            return active_discount.discount_price
        return product.selling_price

    def get_current_prices_for_products(self, *, products: List[models.Product]) -> Dict[int, Decimal]:
        """
        Versão SUPER OTIMIZADA (Bulk):
        Busca todos os descontos ativos para a lista de produtos em UMA única query.
        """
        if not products:
            return {}

        product_ids = [p.id for p in products]
        now = datetime.now(timezone.utc)

        # Query única: "Me dê todos os descontos ativos onde o produto_id está na minha lista"
        active_discounts = (
            self.db.query(models.Discount)
            .filter(
                models.Discount.product_id.in_(product_ids),
                models.Discount.start_time <= now,
                models.Discount.end_time >= now
            )
            .order_by(models.Discount.product_id, models.Discount.discount_price.asc())
            .all()
        )

        # Cria um mapa {product_id: discount_price}
        # Como ordenamos por preço ascendente, o primeiro que aparecer no dict será o menor (ou o último sobrescreve, dependendo da lógica desejada. 
        # Aqui, vamos assumir que queremos o melhor desconto encontrado).
        discount_map = {}
        for d in active_discounts:
            # Se houver múltiplos descontos, esta lógica pega o último processado. 
            # Ajuste a query se quiser garantir o menor preço (já fizemos order_by asc).
            if d.product_id not in discount_map:
                 discount_map[d.product_id] = d.discount_price

        # Monta o resultado final
        prices = {}
        for product in products:
            # Se tiver desconto no mapa, usa. Se não, usa o selling_price original.
            prices[product.id] = discount_map.get(product.id, product.selling_price)
            
        return prices