# ARQUIVO ATUALIZADO: app/routers/sales_cases.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth,crud
from ..database import get_db
from ..models import SalesCaseStatus
from ..services.sales_case_service import SalesCaseService, SalesCaseLogicError, SalesCaseAuthorizationError # <-- IMPORTAÇÕES CHAVE
from ..core.config import settings
from ..schemas import SalesCaseItemAdd, SalesCaseItemUpdate
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

@router.post("/{case_id}/items", response_model=schemas.SalesCaseResponse)
def add_item_to_sales_case(
    case_id: int,
    item_in: schemas.SalesCaseItemAdd,
    service: SalesCaseService = Depends(get_sales_case_service),
    current_admin: models.User = Depends(auth.require_admin_user) # Apenas Admin edita estojo (regra de negócio comum)
):
    """
    Adiciona um item ao estojo.
    Pode usar `product_id` ou `barcode`.
    Se o item já existir, soma a quantidade.
    """
    try:
        updated_case = service.add_item_to_case(case_id=case_id, item_in=item_in)
        return updated_case
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{case_id}/items/{product_id}", response_model=schemas.SalesCaseResponse)
def update_sales_case_item(
    case_id: int,
    product_id: int,
    item_update: schemas.SalesCaseItemUpdate,
    service: SalesCaseService = Depends(get_sales_case_service),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """
    Atualiza a quantidade de um item no estojo.
    Envie `quantity: 0` para remover o item do estojo.
    """
    try:
        updated_case = service.update_item_quantity(
            case_id=case_id, 
            product_id=product_id, 
            quantity=item_update.quantity
        )
        return updated_case
    except SalesCaseLogicError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sales_case(
    case_id: int,
    service: SalesCaseService = Depends(get_sales_case_service),
    current_admin: models.User = Depends(auth.require_admin_user) # Apenas Admin pode deletar
):
    """
    Exclui um estojo.
    Se o estojo estiver 'on_loan', o sistema devolve automaticamente 
    os itens para o estoque disponível antes de excluir.
    """
    try:
        service.delete_case(case_id=case_id)
        return None
    except SalesCaseLogicError as e:
        # Se não encontrou o ID, retornamos 404
        if "not found" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        # Outros erros lógicos (banco, etc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))