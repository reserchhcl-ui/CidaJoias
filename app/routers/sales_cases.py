# app/routers/sales_cases.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db
from ..services.sales_case_service import SalesCaseService, SalesCaseLogicError, SalesCaseAuthorizationError

router = APIRouter(
    prefix="/sales-cases",
    tags=["Sales Cases (Vendedora)"]
)

def get_service(db: Session = Depends(get_db)) -> SalesCaseService:
    return SalesCaseService(db)

# --- VISUALIZAÇÃO ---

@router.get("/meus-estojos", response_model=List[schemas.SalesCaseResponse])
def get_my_cases(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_sales_rep_user)
):
    """
    Lista apenas os estojos que estão com a vendedora logada.
    """
    return crud.sales_case.get_multi_for_user(db, current_user=current_user)

@router.get("/{case_id}", response_model=schemas.SalesCaseResponse)
def get_case_detail(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_sales_rep_user)
):
    """
    Vê detalhes de um estojo específico (Validando posse).
    """
    db_case = crud.sales_case.get(db, case_id=case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Estojo não encontrado")
    
    if db_case.sales_rep_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para ver este estojo")
        
    return db_case

# --- MARKETING & DOWNLOADS ---

@router.get("/{case_id}/marketing-pack")
def download_marketing_images(
    case_id: int,
    service: SalesCaseService = Depends(get_service),
    current_user: models.User = Depends(auth.require_sales_rep_user)
):
    """
    Baixa um ZIP com todas as fotos dos produtos para divulgação.
    """
    try:
        return service.generate_marketing_pack(case_id=case_id, user_id=current_user.id)
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except SalesCaseAuthorizationError as e:
        raise HTTPException(status_code=403, detail=str(e))

# --- DEVOLUÇÃO (CHECKOUT) ---

@router.post("/{case_id}/return", response_model=schemas.SalesCaseReturnReport)
def return_sales_case(
    case_id: int,
    return_request: schemas.SalesCaseReturnRequest,
    service: SalesCaseService = Depends(get_service),
    current_user: models.User = Depends(auth.require_sales_rep_user)
):
    """
    Vendedora inicia o processo de devolução do estojo.
    """
    try:
        return service.process_case_return(
            case_id=case_id, 
            return_request=return_request, 
            current_user=current_user
        )
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except SalesCaseAuthorizationError as e:
        raise HTTPException(status_code=403, detail=str(e))