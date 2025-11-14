# ARQUIVO ATUALIZADO: app/routers/sales_cases.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, auth, crud
from ..database import get_db
from ..models import SalesCaseStatus
from ..services.sales_case_service import SalesCaseService, SalesCaseLogicError, SalesCaseAuthorizationError # <-- IMPORTAÇÕES CHAVE

router = APIRouter(
    prefix="/sales-cases",
    tags=["Sales Cases"]
)

# --- NOVA DEPENDÊNCIA PARA O SERVIÇO ---
def get_sales_case_service(db: Session = Depends(get_db)) -> SalesCaseService:
    return SalesCaseService(db=db)

@router.post("/", response_model=schemas.SalesCaseResponse, status_code=status.HTTP_201_CREATED)
def create_new_sales_case(
    case_create: schemas.SalesCaseCreate,
    service: SalesCaseService = Depends(get_sales_case_service),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    try:
        new_case = service.create_new_case(case_create=case_create)
        return new_case
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{case_id}/return", response_model=schemas.SalesCaseReturnReport)
def return_sales_case(
    case_id: int,
    return_request: schemas.SalesCaseReturnRequest,
    service: SalesCaseService = Depends(get_sales_case_service),
    current_user: models.User = Depends(auth.require_admin_or_sales_rep)
):
    try:
        report = service.process_case_return(case_id=case_id, return_request=return_request, current_user=current_user)
        return report
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except SalesCaseAuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.get("/", response_model=List[schemas.SalesCaseResponse])
def read_sales_cases(
    status: Optional[SalesCaseStatus] = None,
    sales_rep_id: Optional[int] = None,
    db: Session = Depends(get_db), # Leituras podem usar o db direto
    current_user: models.User = Depends(auth.require_admin_or_sales_rep)
):
    cases = crud.sales_case.get_multi_for_user(db, current_user=current_user, status=status, sales_rep_id=sales_rep_id)
    return cases

@router.get("/{case_id}", response_model=schemas.SalesCaseResponse)
def read_sales_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_sales_rep)
):
    db_case = crud.sales_case.get(db, case_id=case_id)
    if db_case is None:
        raise HTTPException(status_code=404, detail="Sales case not found")
    if current_user.role == models.UserRole.SALES_REP and db_case.sales_rep_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this sales case")
    return db_case