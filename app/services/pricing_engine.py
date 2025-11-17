# NOVO ARQUIVO: app/services/pricing_engine.py

from sqlalchemy.orm import Session
from decimal import Decimal

from .. import models, crud

class PricingEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_current_price_for_product(self, *, product: models.Product) -> Decimal:
        """
        Implementa a regra de negócio para determinar o preço atual de um produto.
        1. Verifica se existe um desconto ativo.
        2. Se sim, retorna o preço com desconto.
        3. Se não, retorna o preço de venda padrão.
        """
        active_discount = crud.discount.get_active_for_product(db=self.db, product_id=product.id)
        
        if active_discount:
            return active_discount.discount_price
        
        return product.selling_price

    def get_current_prices_for_products(self, *, products: list[models.Product]) -> dict[int, Decimal]:
        """Versão otimizada para buscar preços de múltiplos produtos."""
        # NOTA: Para uma super otimização, poderíamos fazer uma única query complexa
        # para buscar todos os descontos ativos para uma lista de IDs de produtos.
        # Por enquanto, a simplicidade é mais clara.
        prices = {}
        for product in products:
            prices[product.id] = self.get_current_price_for_product(product=product)
        return prices