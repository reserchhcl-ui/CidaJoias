# ARQUIVO: app/routers/discounts.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db

# CORREÇÃO CRÍTICA: Prefixo simples "/discounts". 
# O main.py já encarrega-se de colocar "/api/v1" antes disto.
router = APIRouter(
    prefix="/discounts",
    tags=["Discounts (Admin)"],
    dependencies=[Depends(auth.require_admin_user)]
)

@router.post("/", response_model=schemas.Discount, status_code=status.HTTP_201_CREATED)
def create_discount(
    discount_in: schemas.DiscountCreate,
    db: Session = Depends(get_db)
):
    product = crud.product.get(db, id=discount_in.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {discount_in.product_id} not found."
        )

    # Regra de Negócio: Preço do desconto não pode ser menor que o custo
    if discount_in.discount_price < product.cost_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Discount price ({discount_in.discount_price}) cannot be lower than the product's cost price ({product.cost_price})."
        )
    
    new_discount = crud.discount.create(db=db, obj_in=discount_in)
    return new_discount

@router.get("/", response_model=List[schemas.Discount])
def read_discounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    discounts = crud.discount.get_multi(db, skip=skip, limit=limit)
    return discounts

@router.get("/{discount_id}", response_model=schemas.Discount)
def read_discount(
    discount_id: int,
    db: Session = Depends(get_db)
):
    db_discount = crud.discount.get(db, id=discount_id)
    if db_discount is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with id {discount_id} not found."
        )
    return db_discount

@router.put("/{discount_id}", response_model=schemas.Discount)
def update_discount(
    discount_id: int,
    discount_in: schemas.DiscountUpdate,
    db: Session = Depends(get_db)
):
    db_discount = crud.discount.get(db, id=discount_id)
    if db_discount is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with id {discount_id} not found."
        )
    
    if discount_in.discount_price is not None:
        product = crud.product.get(db, id=db_discount.product_id)
        if product and discount_in.discount_price < product.cost_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Updated discount price ({discount_in.discount_price}) cannot be lower than the product's cost price ({product.cost_price})."
            )

    updated_discount = crud.discount.update(db=db, db_obj=db_discount, obj_in=discount_in)
    return updated_discount

@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db)
):
    db_discount = crud.discount.get(db, id=discount_id)
    if db_discount is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with id {discount_id} not found."
        )
    
    crud.discount.remove(db=db, id=discount_id)
    return None