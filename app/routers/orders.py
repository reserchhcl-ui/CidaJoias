# app/routers/orders.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_new_order(
    order_create: schemas.OrderCreate,
    db: Session = Depends(get_db),
    # Usamos get_current_user, NÃO o de admin! Qualquer user logado pode comprar.
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Cria uma nova encomenda para o utilizador atualmente autenticado.
    """
    try:
        created_order = crud.create_order(db=db, user=current_user, order_create=order_create)
        return created_order
    except ValueError as e:
        # Capturamos o erro da camada CRUD e o transformamos num erro HTTP
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@router.get("/meus-pedidos", response_model=List[schemas.OrderResponse])
def read_user_orders(
    skip: int = 0,
    limit: int = 25,
    db: Session = Depends(get_db),
    # A dependência de segurança que nos dá o utilizador do token
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Obtém o histórico de encomendas do utilizador atualmente autenticado.
    """
    # A lógica de negócio é simplesmente chamar a nossa função CRUD segura e otimizada
    orders = crud.get_orders_by_user(
        db=db, 
        user_id=current_user.id, # O ID vem do token, não da URL!
        skip=skip, 
        limit=limit
    )
    return orders

@router.post("/pedidos", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Public Checkout"])
def public_checkout(
    checkout_request: schemas.CheckoutRequest,
    db: Session = Depends(get_db),
    # 1. Segurança de Acesso: Apenas para CUSTOMER
    current_user: models.User = Depends(auth.require_customer_user)
):
    """
    Endpoint de checkout para clientes.
    Operação atómica, segura e com validação de stock em tempo real.
    """
    try:
        new_order = crud.create_customer_order(db=db, user=current_user, checkout_request=checkout_request)
        return new_order
    except ValueError as e:
        # Traduz o erro de negócio para uma resposta HTTP clara
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@router.get("/meus-pedidos", response_model=List[schemas.OrderResponse], tags=["Public Checkout"])
def read_my_orders(
    skip: int = 0,
    limit: int = 25, # Um limite padrão mais conservador para listas
    db: Session = Depends(get_db),
    # Acesso restrito a clientes, obtendo o utilizador autenticado do token
    current_user: models.User = Depends(auth.require_customer_user)
):
    """
    Obtém o histórico de pedidos para o cliente atualmente autenticado.
    """
    # A lógica é uma chamada direta à nossa função CRUD segura e otimizada.
    # O ID do utilizador é extraído de forma segura do token, não da requisição.
    orders = crud.get_orders_by_customer(
        db=db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return orders