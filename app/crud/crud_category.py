# app/crud/crud_category.py

from typing import Optional
from sqlalchemy.orm import Session
from .base import CRUDBase
from ..models import Category
from ..schemas import CategoryCreate, Category

class CRUDCategory(CRUDBase[Category, CategoryCreate, Category]): # Usando Category schema para update por simplicidade
    def get_by_slug(self, db: Session, *, slug: str) -> Optional[Category]:
        return db.query(self.model).filter(self.model.slug == slug).first()

category = CRUDCategory(Category)