# ARQUIVO ATUALIZADO: app/crud/crud_product.py

from sqlalchemy.orm import Session,joinedload
from typing import List, Optional, Union, Dict, Any
from sqlalchemy import and_, or_, func
from datetime import datetime, timezone
from .base import CRUDBase
from .. import models, schemas
import string
import random


class CRUDProduct(CRUDBase[models.Product, schemas.ProductCreate, schemas.ProductUpdate]):
    
    def create(self, db: Session, *, obj_in: schemas.ProductCreate) -> models.Product:
            """Criação com geração automática de Barcode e Cod_Cat."""
            obj_in_data = obj_in.model_dump()
            
            if not obj_in_data.get("barcode"):
                obj_in_data["barcode"] = self.generate_unique_barcode(db)

            db_obj = self.model(**obj_in_data)
            db.add(db_obj)
            db.flush() # Gera o ID
            
            # Gera cod_cat inicial (Ex: BRI100)
            if db_obj.category_id:
                self._update_cod_cat_logic(db, db_obj, db_obj.category_id)

            db.commit()
            db.refresh(db_obj)
            return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: models.Product, 
        obj_in: Union[schemas.ProductUpdate, Dict[str, Any]]
    ) -> models.Product:
        """
        Atualização com recálculo inteligente do Cod_Cat.
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        # --- LÓGICA DE CORREÇÃO DE CATEGORIA ---
        # Verifica se 'category_id' está sendo alterado
        if "category_id" in update_data:
            new_cat_id = update_data["category_id"]
            
            # Só recalcula se o ID for diferente do atual
            if new_cat_id != db_obj.category_id:
                if new_cat_id is not None:
                    # Busca a nova categoria para pegar o prefixo (Ex: "Colares" -> "COL")
                    category = db.query(models.Category).get(new_cat_id)
                    if category:
                        prefix = category.name[:3].upper()
                        # Atualiza o código no payload antes de salvar (Ex: "COL" + "100")
                        update_data["cod_cat"] = f"{prefix}{db_obj.id}"
                else:
                    # Se removeu a categoria, remove o código
                    update_data["cod_cat"] = None
        # ---------------------------------------

        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def _update_cod_cat_logic(self, db: Session, db_product: models.Product, category_id: int):
        """Helper interno para gerar o código."""
        category = db.query(models.Category).get(category_id)
        if category:
            prefix = category.name[:3].upper()
            db_product.cod_cat = f"{prefix}{db_product.id}"
            db.add(db_product)
    
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
                code = ''.join(random.choices(chars, k=6))
                
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
    
    def get_inventory_stats(self, db: Session) -> schemas.InventoryStats:
            """
            Calcula estatísticas globais do inventário:
            - Quantidade total em estoque físico
            - Quantidade total consignada (on_loan)
            - Valor total do estoque (baseado no preço de custo)
            - Valor total consignado (baseado no preço de custo)
            """
            # Query otimizada que faz o cálculo no banco de dados
            stats = db.query(
                func.sum(models.Product.stock_quantity).label("total_stock"),
                func.sum(models.Product.on_loan_quantity).label("total_loan"),
                func.sum(models.Product.stock_quantity * models.Product.cost_price).label("value_stock"),
                func.sum(models.Product.on_loan_quantity * models.Product.cost_price).label("value_loan")
            ).first()

            # Tratamento para banco vazio (retorna None se não houver produtos)
            return schemas.InventoryStats(
                total_stock_quantity=stats.total_stock or 0,
                total_on_loan_quantity=stats.total_loan or 0,
                total_stock_value=stats.value_stock or 0.0,
                total_on_loan_value=stats.value_loan or 0.0
            )

# Instância exportada para ser usada nos Routers e Services
product = CRUDProduct(models.Product)