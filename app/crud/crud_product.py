# ARQUIVO ATUALIZADO: app/crud/crud_product.py

from sqlalchemy.orm import Session,joinedload
from typing import List, Optional
from sqlalchemy import and_, or_, func
from datetime import datetime, timezone
from .base import CRUDBase
from .. import models, schemas
import string
import random
class CRUDProduct(CRUDBase[models.Product, schemas.ProductCreate, schemas.ProductUpdate]):
    
    def get_multi_filtered(
        self, 
        db: Session, 
        *, 
        filter_params: schemas.ProductFilter,
        skip: int = 0, 
        limit: int = 100
    ) -> List[models.Product]:
        """
        Implementação do padrão Specification/Criteria.
        Constrói a query dinamicamente baseada nos filtros fornecidos.
        """
        # 1. Base Query com Eager Loading de Categoria
        query = db.query(self.model).options(joinedload(models.Product.category))
        
        # 2. Filtro por Termo de Busca (Nome ou Descrição) - Case Insensitive
        if filter_params.search_term:
            search = f"%{filter_params.search_term}%"
            query = query.filter(
                or_(
                    models.Product.name.ilike(search),
                    models.Product.description.ilike(search)
                )
            )

        # 3. Filtro por Categoria
        if filter_params.category_id:
            query = query.filter(models.Product.category_id == filter_params.category_id)

        # 4. Filtro "Somente Promoções" (JOIN Complexo)
        if filter_params.only_promotions:
            now = datetime.now(timezone.utc)
            # Faz um JOIN com Discount e verifica se existe algum ativo agora
            query = query.join(models.Discount).filter(
                and_(
                    models.Discount.start_time <= now,
                    models.Discount.end_time >= now
                )
            )

        # 5. Filtro de Preço (Min/Max)
        # Nota: Filtra pelo selling_price base. 
        # Para filtrar pelo "preço com desconto" seria necessário SQL complexo ou filtro em memória (Python).
        # Por performance, filtramos pelo preço base no banco.
        if filter_params.min_price is not None:
            query = query.filter(models.Product.selling_price >= filter_params.min_price)
        
        if filter_params.max_price is not None:
            query = query.filter(models.Product.selling_price <= filter_params.max_price)

        # 6. Paginação e Execução
        return query.offset(skip).limit(limit).all()    
    
    def get_by_barcode(self, db: Session, *, barcode: str) -> Optional[models.Product]:
        if not barcode:
            return None
        return db.query(self.model).filter(self.model.barcode == barcode).first()
    
    def generate_unique_barcode(self, db: Session) -> str:
            """
            Gera um código alfanumérico de 8 caracteres único (Ex: 'X7Y2Z9A1').
            Verifica colisões no banco para garantir unicidade.
            """
            chars = string.ascii_uppercase + string.digits
            while True:
                # Randomiza 8 caracteres
                code = ''.join(random.choices(chars, k=8))
                
                # Verifica se já existe (Colisão é rara, mas possível)
                if not self.get_by_barcode(db, barcode=code):
                    return code
                
    def get_for_update(self, db: Session, product_id: int) -> Optional[models.Product]:
        """
        Busca um produto aplicando um lock pessimista (SELECT ... FOR UPDATE).
        Vital para evitar 'race conditions' no checkout.
        """
        return (
            db.query(self.model)
            .filter(self.model.id == product_id)
            .with_for_update()
            .first()
        )

    def update_stock(
        self, 
        db: Session, 
        *, 
        db_product: models.Product, 
        change_in_stock: int = 0, 
        change_in_loan: int = 0
    ) -> models.Product:
        """
        Atualiza atomicamente o estoque físico e a quantidade consignada.
        NÃO faz commit para permitir transações maiores no Service.
        """
        db_product.stock_quantity += change_in_stock
        db_product.on_loan_quantity += change_in_loan
        db.add(db_product)
        return db_product

    def decrease_stock(self, db: Session, *, product: models.Product, quantity: int) -> models.Product:
        """
        Helper simples para baixar estoque em vendas diretas.
        """
        product.stock_quantity -= quantity
        db.add(product)
        return product

# Instância exportada para ser usada nos Routers e Services
product = CRUDProduct(models.Product)