# app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, status,BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth,crud
# Importamos o MÓDULO crud_order (para listagem) e o SERVIÇO
from ..services.order_service import OrderService,OrderCreationError
from ..database import get_db
from ..services.email_service import email_service


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
    # Usamos get_current_user, NÃO o de admin! Qualquer user logado pode comprar.
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Cria uma nova encomenda para o utilizador atualmente autenticado.
    """
    try:
        created_order = crud.order.create_order(db=db, user=current_user, order_create=order_create)
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
    orders = crud.order.get_by_user(
        db=db, 
        user_id=current_user.id, # O ID vem do token, não da URL!
        skip=skip, 
        limit=limit
    )
    return orders

@router.post("/pedidos", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Public Checkout"])
def public_checkout(
    checkout_request: schemas.CheckoutRequest,
    background_tasks: BackgroundTasks, # <--- Injeção do FastAPI
    current_user: models.User = Depends(auth.require_customer_user),
    order_service: OrderService = Depends(get_order_service)
):
    try:
        new_order = order_service.create_customer_order(
            user=current_user, 
            checkout_request=checkout_request
        )
        
        # Agendar envio de e-mail (executa APÓS retornar a resposta 201)
        background_tasks.add_task(
            email_service.send_order_confirmation, 
            user=current_user, 
            order=new_order
        )
        
        return new_order
    except ValueError as e:
        # Tratamento de erro específico do serviço
        # Nota: OrderCreationError herda de ValueError no nosso código
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
