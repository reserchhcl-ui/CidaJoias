# app/main.py

from fastapi import FastAPI
from . import models
from .database import engine
from .routers import products, users, orders, sales_cases,discounts# 1. Importar os nossos novos routers

# Cria as tabelas no banco de dados (se não existirem)
#models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cida Joias API",
    description="Back-end."
)

# 2. Incluir os routers na nossa aplicação principal
app.include_router(users.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(sales_cases.router)
app.include_router(discounts.router)
@app.get("/")
def read_root():
    """
    Endpoint raiz. Apenas diz 'Olá' para confirmar que a API está no ar.
    """
    return {"message": "Bem-vindo à API da Cida Joias!"}