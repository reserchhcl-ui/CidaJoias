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