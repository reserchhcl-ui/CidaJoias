# ARQUIVO: app/routers/orders.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..services.order_service import OrderService
from ..database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_new_order(
    order_create: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        created_order = crud.order.create_order_in_db(db=db, user=current_user, order_create=order_create)
        return created_order
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# --- CORREÇÃO: Rota unificada e otimizada ---
@router.get("/meus-pedidos", response_model=List[schemas.OrderResponse])
def read_my_orders(
    skip: int = 0,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Obtém o histórico de pedidos para o cliente logado.
    """
    orders = crud.order.get_orders_by_customer(
        db=db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return orders

@router.post("/pedidos", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Public Checkout"])
def public_checkout(
    checkout_request: schemas.CheckoutRequest,
    current_user: models.User = Depends(auth.get_current_user),
    order_service: OrderService = Depends(get_order_service)
):
    try:
        new_order = order_service.create_customer_order(
            user=current_user, 
            checkout_request=checkout_request
        )
        return new_order
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get("/", response_model=List[schemas.OrderResponse])
def read_all_orders(
    skip: int = 0,
    limit: int = 25,
    db: Session = Depends(get_db),
    # Exige que o usuário seja ADMIN para ver todos os pedidos
    current_user: models.User = Depends(auth.require_admin_user)
):
    """
    Lista todos os pedidos do sistema (Apenas Admins).
    """
    orders = db.query(models.Order)\
        .order_by(models.Order.id.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return orders