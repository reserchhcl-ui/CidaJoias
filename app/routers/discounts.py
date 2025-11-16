# NOVO ARQUIVO: app/routers/discounts.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth, crud
from ..database import get_db

# 1. Definição do Router
# A dependência `auth.require_admin_user` aplicada no nível do router
# garante que CADA endpoint definido aqui exigirá privilégios de administrador.
# Isso evita a repetição e a possibilidade de esquecer a proteção em um endpoint.
router = APIRouter(
    prefix="/discounts",
    tags=["Discounts (Admin)"],
    dependencies=[Depends(auth.require_admin_user)]
)

# 2. Endpoint de Criação (POST)
@router.post("/", response_model=schemas.Discount, status_code=status.HTTP_201_CREATED)
def create_discount(
    discount_in: schemas.DiscountCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo desconto para um produto.

    - **Protegido**: Apenas para administradores.
    - **Regra de Negócio**: Impede que um desconto seja criado se o preço
      promocional for menor que o preço de custo do produto.
    """
    # Passo 1: Validar se o produto ao qual o desconto se refere existe.
    product = crud.product.get(db, id=discount_in.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {discount_in.product_id} not found."
        )

    # Passo 2: A REGRA DE NEGÓCIO BLINDADA (Tolerância Zero)
    if discount_in.discount_price < product.cost_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Discount price ({discount_in.discount_price}) cannot be lower than the product's cost price ({product.cost_price})."
        )
    
    # Passo 3: Se todas as validações passarem, delegar a criação para a camada CRUD.
    new_discount = crud.discount.create(db=db, obj_in=discount_in)
    return new_discount

# 3. Endpoint de Leitura (GET - Todos os Descontos)
@router.get("/", response_model=List[schemas.Discount])
def read_discounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retorna uma lista de todos os descontos cadastrados no sistema, com paginação.

    - **Protegido**: Apenas para administradores.
    """
    discounts = crud.discount.get_multi(db, skip=skip, limit=limit)
    return discounts

# 4. Endpoint de Leitura (GET - Desconto Específico)
@router.get("/{discount_id}", response_model=schemas.Discount)
def read_discount(
    discount_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna os detalhes de um desconto específico pelo seu ID.

    - **Protegido**: Apenas para administradores.
    """
    db_discount = crud.discount.get(db, id=discount_id)
    if db_discount is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with id {discount_id} not found."
        )
    return db_discount

# 5. Endpoint de Atualização (PUT)
@router.put("/{discount_id}", response_model=schemas.Discount)
def update_discount(
    discount_id: int,
    discount_in: schemas.DiscountUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados de um desconto existente (ex: estender a data final).

    - **Protegido**: Apenas para administradores.
    - **Nota**: Este endpoint não re-valida o preço contra o custo,
      assumindo que o preço de custo não mudou. Se essa regra for
      necessária na atualização, a lógica do `create_discount`
      deveria ser replicada aqui.
    """
    db_discount = crud.discount.get(db, id=discount_id)
    if db_discount is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with id {discount_id} not found."
        )
    
    # Validação da regra de negócio também na atualização, para máxima segurança
    if discount_in.discount_price is not None:
        product = crud.product.get(db, id=db_discount.product_id)
        if product and discount_in.discount_price < product.cost_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Updated discount price ({discount_in.discount_price}) cannot be lower than the product's cost price ({product.cost_price})."
            )

    updated_discount = crud.discount.update(db=db, db_obj=db_discount, obj_in=discount_in)
    return updated_discount

# 6. Endpoint de Exclusão (DELETE)
@router.delete("/{discount_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discount(
    discount_id: int,
    db: Session = Depends(get_db)
):
    """
    Remove um desconto do sistema.

    - **Protegido**: Apenas para administradores.
    - **Retorno**: Retorna um status 204 (No Content) em caso de sucesso,
      indicando que a operação foi bem-sucedida e não há corpo na resposta.
    """
    db_discount = crud.discount.get(db, id=discount_id)
    if db_discount is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discount with id {discount_id} not found."
        )
    
    crud.discount.remove(db=db, id=discount_id)
    
    # Não há retorno de corpo na resposta para um DELETE bem-sucedido
    return None