# app/routers/orders_admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db

router = APIRouter(
    prefix="/backoffice/orders",
    tags=["Orders (Admin)"]
)

@router.post("/search", response_model=List[schemas.OrderResponse])
def search_orders_admin(
    filter_params: schemas.OrderFilter,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_or_sales_rep) # SalesRep também pode precisar ver status
):
    """
    (Admin) Busca e filtra pedidos de toda a loja.
    """
    return crud.order.get_multi_filtered(
        db, filter_params=filter_params, skip=skip, limit=limit
    )

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def read_order_detail_admin(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_or_sales_rep)
):
    """
    (Admin) Vê detalhes completos de qualquer pedido.
    """
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user) # Apenas Admin altera status manual
):
    """
    (Admin) Atualiza status do pedido (ex: Marcar como Enviado, Cancelar).
    """
    db_order = crud.order.get(db, id=order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return crud.order.update(db, db_obj=db_order, obj_in=order_update)