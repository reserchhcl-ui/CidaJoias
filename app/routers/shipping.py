# app/routers/shipping.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import schemas
from ..database import get_db
from ..services.shipping_service import ShippingService

router = APIRouter(
    prefix="/shipping",
    tags=["Shipping"]
)

def get_shipping_service(db: Session = Depends(get_db)):
    return ShippingService(db)

@router.post("/simulate", response_model=List[schemas.ShippingOption])
def simulate_shipping(
    simulation_in: schemas.ShippingSimulationRequest,
    service: ShippingService = Depends(get_shipping_service)
):
    """
    Calcula opções de frete com base no CEP e nos itens do carrinho.
    Não requer autenticação (público para simulação no carrinho).
    """
    options = service.calculate_shipping(
        zip_code=simulation_in.zip_code,
        items=simulation_in.items
    )
    return options