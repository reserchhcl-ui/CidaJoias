from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from faker import Faker
from app import crud, schemas
from app.models import Coupon, CouponType

fake = Faker()

def create_coupon(
    db: Session, 
    code: str = None, 
    discount_value: float = 10.0, 
    discount_type: CouponType = CouponType.FIXED,
    min_purchase: float = 0.0,
    active: bool = True
) -> Coupon:
    """Cria um cupom para testes."""
    if not code:
        code = fake.unique.word().upper()
    
    expiration = datetime.now(timezone.utc) + timedelta(days=30)
    
    coupon_in = schemas.CouponCreate(
        code=code,
        discount_type=discount_type,
        discount_value=Decimal(str(discount_value)),
        min_purchase_amount=Decimal(str(min_purchase)),
        expiration_date=expiration,
        is_active=active
    )
    return crud.coupon.create(db=db, obj_in=coupon_in)