from sqlalchemy.orm import Session
from faker import Faker
from app import crud, schemas
from app.models import Category

fake = Faker()

def create_random_category(db: Session) -> Category:
    """Cria uma categoria aleatória para testes."""
    name = fake.unique.word().capitalize() + " " + fake.word()
    slug = name.lower().replace(" ", "-")
    category_in = schemas.CategoryCreate(name=name, slug=slug)
    return crud.category.create(db=db, obj_in=category_in)