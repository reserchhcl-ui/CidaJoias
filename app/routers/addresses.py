# app/routers/addresses.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db

router = APIRouter(
    prefix="/addresses",
    tags=["Addresses"],
    dependencies=[Depends(auth.require_customer_user)] # Apenas usuários logados
)

@router.post("/", response_model=schemas.Address, status_code=status.HTTP_201_CREATED)
def create_address(
    address_in: schemas.AddressCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.address.create(db, obj_in=address_in, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Address])
def read_my_addresses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.address.get_multi_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.put("/{address_id}", response_model=schemas.Address)
def update_address(
    address_id: int,
    address_in: schemas.AddressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    address = crud.address.get(db, id=address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    if address.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return crud.address.update(db, db_obj=address, obj_in=address_in)

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    address = crud.address.get(db, id=address_id)
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    if address.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    crud.address.remove(db, id=address_id)
    return None