# app/routers/coupons.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal

from .. import models, schemas, auth, crud
from ..database import get_db
from ..services.order_service import OrderService # Importamos apenas para lógica auxiliar se necessário

router = APIRouter(
    prefix="/coupons",
    tags=["Coupons"]
)

# --- ADMIN ROUTES ---

@router.post("/", response_model=schemas.CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    coupon_in: schemas.CouponCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """(Admin) Cria um novo cupom de desconto."""
    if crud.coupon.get_by_code(db, code=coupon_in.code):
        raise HTTPException(status_code=400, detail="Coupon with this code already exists.")
    return crud.coupon.create(db, obj_in=coupon_in)

@router.get("/", response_model=List[schemas.CouponResponse])
def read_coupons(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """(Admin) Lista todos os cupons."""
    return crud.coupon.get_multi(db, skip=skip, limit=limit)

@router.put("/{coupon_id}", response_model=schemas.CouponResponse)
def update_coupon(
    coupon_id: int,
    coupon_in: schemas.CouponUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """(Admin) Atualiza um cupom."""
    coupon = crud.coupon.get(db, id=coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return crud.coupon.update(db, db_obj=coupon, obj_in=coupon_in)

# --- PUBLIC ROUTES ---

@router.get("/validate/{code}", status_code=status.HTTP_200_OK)
def validate_coupon(
    code: str,
    value: float = 0.0, # O frontend envia o valor atual do carrinho para simulação
    db: Session = Depends(get_db)
):
    """
    Verifica se um cupom é válido para um determinado valor de compra.
    Retorna o valor do desconto simulado.
    """
    # Reutilizamos a lógica do Service para não duplicar regras, 
    # mas instanciamos aqui apenas para validação "dry-run".
    # Nota: Como _validate_and_apply_coupon é 'protected', idealmente extraímos
    # a lógica de validação para um método público se reutilizado muito, 
    # mas aqui faremos uma verificação manual rápida para o frontend.
    
    coupon = crud.coupon.get_by_code(db, code=code)
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom inválido.")
    
    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="Cupom inativo.")
        
    from datetime import datetime, timezone
    if coupon.expiration_date < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cupom expirado.")
        
    if coupon.max_uses is not None and coupon.current_uses >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Cupom esgotado.")
        
    cart_value = Decimal(str(value))
    if cart_value < coupon.min_purchase_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Valor mínimo para este cupom: R$ {coupon.min_purchase_amount}"
        )

    # Simula desconto
    discount = Decimal(0)
    if coupon.discount_type == models.CouponType.PERCENTAGE:
        discount = cart_value * (coupon.discount_value / 100)
    else:
        discount = coupon.discount_value
        
    if discount > cart_value:
        discount = cart_value

    return {
        "code": coupon.code,
        "valid": True,
        "discount_amount": discount,
        "new_total": cart_value - discount
    }