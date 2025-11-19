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