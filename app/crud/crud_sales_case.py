# NOVO ARQUIVO: app/crud/crud_sales_case.py

from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from .. import models
from ..models import SalesCaseStatus, User

class CRUDSalesCase:
    def get(self, db: Session, *, case_id: int) -> Optional[models.SalesCase]:
        """
        Busca um único estojo pelo seu ID, carregando de forma otimizada
        os itens e os detalhes dos produtos associados.
        """
        return (
            db.query(models.SalesCase)
            .filter(models.SalesCase.id == case_id)
            .options(
                joinedload(models.SalesCase.items)
                .joinedload(models.SalesCaseItem.product)
            )
            .first()
        )

    def get_multi_for_user(
        self,
        db: Session,
        *,
        current_user: User,
        status: Optional[SalesCaseStatus] = None,
        sales_rep_id: Optional[int] = None
    ) -> List[models.SalesCase]:
        """
        Constrói a query base para buscar estojos com filtros.
        A lógica de autorização (qual usuário pode ver o quê) é aplicada aqui.
        """
        query = db.query(models.SalesCase).order_by(models.SalesCase.id.desc())

        # --- Lógica de Segurança e Filtragem ---
        if current_user.role == models.UserRole.SALES_REP:
            # Força o filtro para a própria vendedora, ignorando o query param `sales_rep_id`
            query = query.filter(models.SalesCase.sales_rep_id == current_user.id)
        elif current_user.role == models.UserRole.ADMIN and sales_rep_id:
            # Admin pode filtrar por uma vendedora específica
            query = query.filter(models.SalesCase.sales_rep_id == sales_rep_id)

        if status:
            query = query.filter(models.SalesCase.status == status)
        
        return query.all()

    def create_case(self, db: Session, *, sales_rep_id: int, return_by_date) -> models.SalesCase:
        """Cria APENAS o registro principal do SalesCase. Não faz commit."""
        db_case = models.SalesCase(
            sales_rep_id=sales_rep_id,
            return_by_date=return_by_date,
            status=SalesCaseStatus.ON_LOAN # Default status
        )
        db.add(db_case)
        db.flush() # Para obter o db_case.id antes do commit
        return db_case

    def create_item(self, db: Session, *, case_id: int, product_id: int, quantity: int) -> models.SalesCaseItem:
        """Cria APENAS um item (SalesCaseItem) associado a um estojo. Não faz commit."""
        db_item = models.SalesCaseItem(
            case_id=case_id,
            product_id=product_id,
            quantity=quantity
        )
        db.add(db_item)
        return db_item

    def update_status(self, db: Session, *, db_case: models.SalesCase, status: SalesCaseStatus) -> models.SalesCase:
        """Atualiza o status de um estojo. Não faz commit."""
        db_case.status = status
        db.add(db_case)
        return db_case

# Instância única para ser importada
sales_case = CRUDSalesCase()