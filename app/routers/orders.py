from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..services.order_service import OrderService
from ..database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["Orders (Customer)"]
)

def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)

# --- LISTAGEM (Meus Pedidos) ---
@router.get("/", response_model=List[schemas.OrderResponse])
def read_my_orders(
    skip: int = 0,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Obtém o histórico de pedidos para o cliente logado.
    Endpoint: GET /api/v1/orders/
    """
    orders = crud.order.get_orders_by_customer(
        db=db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return orders

# --- CRIAÇÃO (Checkout) ---
@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_checkout(
    checkout_request: schemas.CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_customer_user),
    service: OrderService = Depends(get_order_service)
):
    """
    Realiza o Checkout e cria um novo pedido.
    Endpoint: POST /api/v1/orders/
    
    Processa:
    1. Validação de Estoque
    2. Cálculo de Subtotal e Frete
    3. Criação dos Itens no Banco
    """
    try:
        # Chama o serviço robusto que corrigimos anteriormente
        return service.create_customer_order(user=current_user, checkout_request=checkout_request)
    except Exception as e:
        # Captura erros genéricos ou de negócio (OrderCreationError)
        raise HTTPException(status_code=400, detail=str(e))

# --- DETALHES (Single Order) ---
@router.get("/{order_id}", response_model=schemas.OrderResponse)
def read_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Vê detalhes de um pedido específico.
    Proteção: Só retorna se o pedido pertencer ao usuário logado.
    Endpoint: GET /api/v1/orders/{id}
    """
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validação de Propriedade
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
        
    return order