# app/routers/sales_cases_admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, auth, crud
from ..database import get_db
from ..models import SalesCaseStatus
from ..services.sales_case_service import SalesCaseService, SalesCaseLogicError

router = APIRouter(
    prefix="/backoffice/sales-cases",
    tags=["Sales Cases (Admin)"]
)

def get_service(db: Session = Depends(get_db)) -> SalesCaseService:
    return SalesCaseService(db)

# --- CRIAÇÃO E GESTÃO ---

@router.post("/", response_model=schemas.SalesCaseResponse, status_code=status.HTTP_201_CREATED)
def create_sales_case_admin(
    case_create: schemas.SalesCaseCreate,
    service: SalesCaseService = Depends(get_service),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    try:
        return service.create_new_case(case_create=case_create)
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[schemas.SalesCaseResponse])
def list_all_sales_cases_admin(
    status: Optional[SalesCaseStatus] = None,
    sales_rep_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """Admin vê TODOS os estojos."""
    return crud.sales_case.get_multi_for_user(
        db, current_user=current_admin, status=status, sales_rep_id=sales_rep_id
    )

@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sales_case_admin(
    case_id: int,
    service: SalesCaseService = Depends(get_service),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    try:
        service.delete_case(case_id=case_id)
    except SalesCaseLogicError as e:
        if "not found" in str(e):
             raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

# --- GESTÃO DE ITENS DO ESTOJO ---

@router.post("/{case_id}/items", response_model=schemas.SalesCaseResponse)
def add_item_to_case_admin(
    case_id: int,
    item_in: schemas.SalesCaseItemAdd,
    service: SalesCaseService = Depends(get_service),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    try:
        return service.add_item_to_case(case_id=case_id, item_in=item_in)
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{case_id}/items/{product_id}", response_model=schemas.SalesCaseResponse)
def update_item_quantity_admin(
    case_id: int,
    product_id: int,
    item_update: schemas.SalesCaseItemUpdate,
    service: SalesCaseService = Depends(get_service),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    try:
        return service.update_item_quantity(
            case_id=case_id, product_id=product_id, quantity=item_update.quantity
        )
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))