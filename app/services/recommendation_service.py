# NOVO ARQUIVO: app/services/recommendation_service.py

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from .. import models, crud

class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_related_products(self, product_id: int, limit: int = 4) -> List[models.Product]:
        """
        Estratégia 1: 'Produtos Similares'
        Retorna produtos da mesma categoria, excluindo o próprio.
        """
        product = crud.product.get(self.db, id=product_id)
        if not product or not product.category_id:
            return []

        return (
            self.db.query(models.Product)
            .filter(
                models.Product.category_id == product.category_id,
                models.Product.id != product_id,
                models.Product.stock_quantity > 0 # Apenas produtos em estoque
            )
            .limit(limit)
            .all()
        )

    def get_trending_products(self, limit: int = 4) -> List[models.Product]:
        """
        Estratégia 2: 'Mais Vendidos' (Trending)
        Conta a frequência de produtos na tabela order_items.
        """
        # Query complexa: Agrupa itens de pedido por produto, conta e ordena desc
        stmt = (
            self.db.query(
                models.OrderItem.product_id,
                func.count(models.OrderItem.product_id).label("total_sold")
            )
            .group_by(models.OrderItem.product_id)
            .order_by(desc("total_sold"))
            .limit(limit)
        )
        
        top_ids = [row.product_id for row in stmt.all()]
        
        if not top_ids:
            # Fallback: Se não tem vendas, retorna os últimos cadastrados
            return self.db.query(models.Product).order_by(models.Product.id.desc()).limit(limit).all()

        # Busca os objetos completos mantendo a ordem (in clause não garante ordem, então reordenamos em python ou case)
        products = self.db.query(models.Product).filter(models.Product.id.in_(top_ids)).all()
        # Reordena para match com top_ids
        products_map = {p.id: p for p in products}
        return [products_map[id] for id in top_ids if id in products_map]

    def get_personalized_recommendations(self, user_id: int, limit: int = 4) -> List[models.Product]:
        """
        Estratégia 3: 'Você pode gostar' (Baseado no histórico de compras)
        Identifica a categoria mais comprada pelo usuário e sugere novos itens dela.
        """
        # 1. Descobrir categoria favorita
        favorite_cat_query = (
            self.db.query(
                models.Product.category_id,
                func.count(models.Product.category_id).label("cat_count")
            )
            .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)
            .join(models.Order, models.Order.id == models.OrderItem.order_id)
            .filter(models.Order.user_id == user_id)
            .group_by(models.Product.category_id)
            .order_by(desc("cat_count"))
            .first()
        )

        if not favorite_cat_query:
            return self.get_trending_products(limit) # Fallback para Trending

        category_id = favorite_cat_query.category_id

        # 2. Recomendar produtos dessa categoria que o usuário AINDA NÃO comprou
        # (Subquery dos produtos já comprados)
        bought_ids = (
            self.db.query(models.OrderItem.product_id)
            .join(models.Order)
            .filter(models.Order.user_id == user_id)
        )

        recommendations = (
            self.db.query(models.Product)
            .filter(
                models.Product.category_id == category_id,
                models.Product.id.not_in(bought_ids),
                models.Product.stock_quantity > 0
            )
            .limit(limit)
            .all()
        )
        
        if not recommendations:
            return self.get_trending_products(limit)
            
        return recommendations