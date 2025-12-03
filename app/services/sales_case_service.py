# app/services/sales_case_service.py

from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List
from .. import models, schemas, crud
from ..models import UserRole, SalesCaseStatus

# Exceções customizadas
class SalesCaseLogicError(ValueError): pass
class SalesCaseAuthorizationError(PermissionError): pass

class SalesCaseService:
    def __init__(self, db: Session):
        self.db = db

    def create_new_case(self, *, case_create: schemas.SalesCaseCreate) -> models.SalesCase:
        # --- FASE 1: VALIDAÇÕES DE NEGÓCIO ---
        
        # CORREÇÃO 1: Usar 'id' em vez de 'user_id' para CRUDBase
        sales_rep = crud.user.get(self.db, id=case_create.sales_rep_id)
        
        if not sales_rep or sales_rep.role != UserRole.SALES_REP:
            raise SalesCaseLogicError(f"Sales representative with id {case_create.sales_rep_id} not found or is not a sales_rep.")

        products_to_loan = []
        for item in case_create.items:
            # CORREÇÃO 2: Usar 'id' em vez de 'product_id' para CRUDBase
            product = crud.product.get(self.db, id=item.product_id)
            
            if not product:
                raise SalesCaseLogicError(f"Product with id {item.product_id} not found.")
            
            available_stock = product.stock_quantity - product.on_loan_quantity
            if available_stock < item.quantity:
                raise SalesCaseLogicError(f"Insufficient available stock for product '{product.name}'. Available: {available_stock}, Requested: {item.quantity}")
            products_to_loan.append({"product": product, "quantity": item.quantity})

        # --- FASE 2: EXECUÇÃO TRANSACIONAL ---
        try:
            return_by_date = datetime.now(timezone.utc) + timedelta(days=case_create.loan_duration_days)
            # Aqui usamos 'sales_rep_id' pois é o método customizado create_case do CRUDSalesCase
            db_case = crud.sales_case.create_case(self.db, sales_rep_id=case_create.sales_rep_id, return_by_date=return_by_date)

            for item_data in products_to_loan:
                product = item_data["product"]
                quantity = item_data["quantity"]
                # create_item do CRUDSalesCase espera case_id e product_id
                crud.sales_case.create_item(self.db, case_id=db_case.id, product_id=product.id, quantity=quantity)
                crud.product.update_stock(self.db, db_product=product, change_in_stock=0, change_in_loan=+quantity)
            
            self.db.commit()
            self.db.refresh(db_case)
            return db_case
        except Exception as e:
            self.db.rollback()
            if isinstance(e, SalesCaseLogicError):
                raise e
            raise SalesCaseLogicError(f"An unexpected error occurred during case creation: {e}")

    def process_case_return(self, *, case_id: int, return_request: schemas.SalesCaseReturnRequest, current_user: models.User) -> schemas.SalesCaseReturnReport:
        # --- FASE 1: VALIDAÇÕES DE NEGÓCIO E AUTORIZAÇÃO ---
        db_case = crud.sales_case.get(self.db, case_id=case_id)
        if not db_case:
            raise SalesCaseLogicError("Sales case not found.")
        if db_case.status != SalesCaseStatus.ON_LOAN:
            raise SalesCaseLogicError(f"Sales case is not in '{SalesCaseStatus.ON_LOAN.value}' status.")
        if current_user.role == UserRole.SALES_REP and db_case.sales_rep_id != current_user.id:
            raise SalesCaseAuthorizationError("Not authorized to return this sales case.")

        loaned_items_map = {item.product_id: item.quantity for item in db_case.items}
        items_sold_map = {item.product_id: item.quantity_sold for item in return_request.items_sold}
        
        for product_id, quantity_sold in items_sold_map.items():
            if quantity_sold > loaned_items_map.get(product_id, 0):
                raise SalesCaseLogicError(f"Cannot sell more items than were loaned for product ID {product_id}.")

        # --- FASE 2: EXECUÇÃO TRANSACIONAL ---
        try:
            items_summary_report = []
            total_items_sold = 0
            total_value_sold = 0.0
            
            for product_id, quantity_loaned in loaned_items_map.items():
                quantity_sold = items_sold_map.get(product_id, 0)
                
                # CORREÇÃO 3: Usar 'id' para CRUDBase
                product = crud.product.get(self.db, id=product_id)
                if not product:
                     raise SalesCaseLogicError(f"Product with ID {product_id} from case seems to be missing.")

                crud.product.update_stock(self.db, db_product=product, change_in_stock=-quantity_sold, change_in_loan=-quantity_loaned)
                
                # CORREÇÃO 4: Usar 'selling_price' em vez de 'price'
                subtotal = quantity_sold * float(product.selling_price)
                items_summary_report.append(schemas.ItemReturnSummary(
                    product_name=product.name, quantity_loaned=quantity_loaned, quantity_sold=quantity_sold,
                    quantity_returned=quantity_loaned - quantity_sold, price_per_item=float(product.selling_price), subtotal_sold=subtotal
                ))
                total_items_sold += quantity_sold
                total_value_sold += subtotal
            
            new_order_id = None
            if total_items_sold > 0:
                new_order = crud.order.create_order(self.db, user_id=db_case.sales_rep_id, status="completed_by_sales_rep")
                for item_sold in return_request.items_sold:
                    if item_sold.quantity_sold > 0:
                        # CORREÇÃO 5: Usar 'id' e 'selling_price'
                        product = crud.product.get(self.db, id=item_sold.product_id)
                        crud.order.create_order_item(self.db, order_id=new_order.id, product_id=item_sold.product_id, 
                                                     quantity=item_sold.quantity_sold, price_at_purchase=product.selling_price)
                new_order_id = new_order.id

            crud.sales_case.update_status(self.db, db_case=db_case, status=SalesCaseStatus.RETURNED)
            self.db.commit()

            return schemas.SalesCaseReturnReport(
                case_id=case_id, new_order_id=new_order_id, sales_rep_id=db_case.sales_rep_id, date_returned=datetime.now(timezone.utc),
                total_items_sold=total_items_sold, total_value_sold=total_value_sold, items_summary=items_summary_report
            )
        except Exception as e:
            self.db.rollback()
            if isinstance(e, (SalesCaseLogicError, SalesCaseAuthorizationError)):
                raise e
            raise SalesCaseLogicError(f"An unexpected error occurred during case return processing: {e}")