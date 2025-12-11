# ARQUIVO: app/routers/orders.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..services.order_service import OrderService,OrderCreationError
from ..database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["Orders (Customer)"]
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

@router.post("/pedidos", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_customer_order(
    checkout_request: schemas.CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_customer_user),
    service: OrderService = Depends(get_order_service)
):
    """
    (Cliente) Finaliza o carrinho e cria um pedido.
    """
    try:
        return service.create_customer_order(user=current_user, checkout_request=checkout_request)
    except OrderCreationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/{order_id}", response_model=schemas.OrderResponse)
def read_my_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    (Cliente) Vê detalhes de um pedido específico.
    Proteção: Só retorna se o pedido pertencer ao usuário.
    """
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
        
    return order