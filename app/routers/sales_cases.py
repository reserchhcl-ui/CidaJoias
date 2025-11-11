# app/routers/sales_cases.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db

router = APIRouter(
    prefix="/sales-cases",
    tags=["Sales Cases"]
)

@router.post("/", response_model=schemas.SalesCaseResponse, status_code=status.HTTP_201_CREATED)
def create_new_sales_case(
    case_create: schemas.SalesCaseCreate,
    db: Session = Depends(get_db),
    # Apenas administradores podem criar e atribuir estojos
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """
    Cria um novo estojo de vendas para uma vendedora.
    - Requer privilégios de Administrador.
    - Valida o stock disponível.
    - Operação transacional.
    """
    try:
        new_case = crud.create_sales_case(db=db, case_create=case_create)
        return new_case
    except ValueError as e:
        # Captura os erros de lógica de negócio do CRUD e os converte em erros HTTP
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )