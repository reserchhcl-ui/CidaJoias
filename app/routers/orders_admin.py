# app/routers/orders_admin.py

from fastapi import APIRouter, Depends, HTTPException, status,BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db
from ..services.email_service import email_service

router = APIRouter(
    prefix="/backoffice/orders",
    tags=["Orders (Admin)"]
)

@router.post("/search", response_model=List[schemas.OrderResponse])
def search_orders_admin(
    filters: schemas.OrderFilter,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_sales_rep)
):
    """
    Lista pedidos com filtros avançados.
    Útil para o Dashboard Administrativo.
    """
    orders = crud.order.get_multi_filtered(
        db=db, filters=filters, skip=skip, limit=limit
    )
    return orders

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order_details_admin(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_sales_rep)
):
    """
    Acessa um pedido específico sem restrição de dono (Admin vê tudo).
    """
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    order_update: schemas.OrderUpdate,
    background_tasks: BackgroundTasks, # <--- Injeção da Task
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_user)
):
    """
    Atualiza status do pedido e envia e-mail de notificação ao cliente.
    """
    # 1. Buscar Pedido
    db_order = crud.order.get(db, id=order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # 2. Verificar se houve mudança real de status
    old_status = db_order.status
    has_status_changed = (order_update.status is not None) and (order_update.status != old_status)

    # 3. Atualizar no Banco
    updated_order = crud.order.update(db, db_obj=db_order, obj_in=order_update)
    
    # 4. Enviar E-mail em Segundo Plano (Se mudou o status)
    if has_status_changed:
        # Precisamos carregar o usuário dono do pedido para pegar o e-mail
        # Se o lazy loading não tiver trazido o owner, acessamos ele aqui:
        customer = updated_order.owner 
        
        if customer:
            background_tasks.add_task(
                email_service.send_order_status_update, 
                order=updated_order, 
                user=customer, 
                new_status=updated_order.status
            )

    return updated_order