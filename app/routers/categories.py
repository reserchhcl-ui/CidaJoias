# app/routers/categories.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, crud, auth
from ..database import get_db

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

@router.get("/", response_model=List[schemas.Category])
def read_categories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Listar todas as categorias."""
    return crud.category.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """Criar nova categoria (Apenas Admin)."""
    if crud.category.get_by_slug(db, slug=category_in.slug):
        raise HTTPException(
            status_code=400,
            detail="A category with this slug already exists."
        )
    return crud.category.create(db, obj_in=category_in)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """Deletar categoria (Apenas Admin)."""
    category = crud.category.get(db, id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    crud.category.remove(db, id=category_id)