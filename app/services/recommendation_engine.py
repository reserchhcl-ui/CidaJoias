# ARQUIVO ATUALIZADO: app/services/recommendation_engine.py

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from .. import models

class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendations_for_user(self, user_id: int, limit: int = 5) -> List[models.Product]:
        # 1. Subquery: IDs dos produtos que este usuário já comprou
        purchased_product_ids = (
            self.db.query(models.OrderItem.product_id)
            .join(models.Order)
            .filter(models.Order.user_id == user_id)
            .scalar_subquery()
        )

        # 2. Query Principal: Best Sellers não comprados
        recommended_products = (
            self.db.query(models.Product)
            .join(models.OrderItem)
            .filter(models.Product.id.notin_(purchased_product_ids))
            .group_by(models.Product.id)
            .order_by(desc(func.count(models.OrderItem.id)))
            .limit(limit)
            .all()
        )

        # 3. Fallback: Produtos recentes
        if len(recommended_products) < limit:
            needed = limit - len(recommended_products)
            existing_ids = [p.id for p in recommended_products]
            
            new_products = (
                self.db.query(models.Product)
                .filter(models.Product.id.notin_(purchased_product_ids))
                .filter(models.Product.id.notin_(existing_ids))
                .order_by(models.Product.id.desc())
                .limit(needed)
                .all()
            )
            recommended_products.extend(new_products)

        return recommended_products

    def get_similar_products(self, product_id: int, limit: int = 4) -> List[models.Product]:
        # CORREÇÃO: Uso de session.get() ao invés de query(...).get()
        target_product = self.db.get(models.Product, product_id)
        
        if not target_product:
            return []

        min_price = float(target_product.selling_price) * 0.7
        max_price = float(target_product.selling_price) * 1.3

        similar_products = (
            self.db.query(models.Product)
            .filter(models.Product.id != product_id)
            .filter(models.Product.selling_price.between(min_price, max_price))
            .limit(limit)
            .all()
        )
        
        return similar_products
    
    def get_trending_products(self, limit: int = 4) -> List[models.Product]:
        """
        Retorna os produtos mais vendidos (Trending) baseando-se na contagem
        de itens nos pedidos (order_items).
        """
        # Query analítica: Conta quantas vezes cada produto aparece em order_items
        # SELECT product_id, count(*) as sales_count FROM order_items GROUP BY product_id ORDER BY sales_count DESC
        trending_query = (
            self.db.query(
                models.OrderItem.product_id,
                func.count(models.OrderItem.product_id).label("sales_count")
            )
            .group_by(models.OrderItem.product_id)
            .order_by(desc("sales_count"))
            .limit(limit)
            .all()
        )
        
        if not trending_query:
            # Cold Start: Se não houver vendas, retorna produtos aleatórios ou os últimos cadastrados
            return self.get_new_arrivals(limit=limit)

        # Extrai os IDs e busca os objetos completos
        product_ids = [t[0] for t in trending_query]
        
        # Preserva a ordem de popularidade
        products = self.db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
        products_map = {p.id: p for p in products}
        ordered_products = [products_map[pid] for pid in product_ids if pid in products_map]
        
        # 4. Preenchimento (Backfill)
        # Se pedimos 4, mas só 2 produtos venderam, completamos com lançamentos
        if len(ordered_products) < limit:
            needed = limit - len(ordered_products)
            exclude_ids = [p.id for p in ordered_products]
            fillers = self.get_new_arrivals(limit=needed, exclude_ids=exclude_ids)
            ordered_products.extend(fillers)
            
        return ordered_products
    
    def get_new_arrivals(self, limit: int = 4, exclude_ids: List[int] = []) -> List[models.Product]:
        """Retorna os produtos mais recentes."""
        query = self.db.query(models.Product).order_by(models.Product.id.desc())
        if exclude_ids:
            query = query.filter(models.Product.id.notin_(exclude_ids))
        return query.limit(limit).all()