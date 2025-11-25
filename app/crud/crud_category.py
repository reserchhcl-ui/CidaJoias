# app/crud/crud_category.py

from typing import Optional
from sqlalchemy.orm import Session
from .base import CRUDBase
from .. import models, schemas # Importamos os módulos inteiros

# CRUDBase[ModelType, CreateSchema, UpdateSchema]
class CRUDCategory(CRUDBase[models.Category, schemas.CategoryCreate, schemas.Category]):
    def get_by_slug(self, db: Session, *, slug: str) -> Optional[models.Category]:
        return db.query(self.model).filter(self.model.slug == slug).first()

# Agora passamos corretamente o MODELO SQLAlchemy
category = CRUDCategory(models.Category)