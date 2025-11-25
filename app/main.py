# app/main.py

from fastapi import FastAPI,APIRouter
from .core.config import settings
from .routers import products, users, orders, sales_cases, discounts, recommendations, categories, coupons
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Cida Joias API",
    description="Back-end."
)
api_router = APIRouter(prefix=settings.API_V1_STR)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")
# 2. Incluir os routers na nossa aplicação principal
api_router.include_router(users.router)
api_router.include_router(products.router)
api_router.include_router(categories.router)
api_router.include_router(orders.router)
api_router.include_router(sales_cases.router)
api_router.include_router(discounts.router)
api_router.include_router(coupons.router)
api_router.include_router(recommendations.router)

app.include_router(api_router)
@app.get("/")
def read_root():
    """
    Endpoint raiz. Apenas diz 'Olá' para confirmar que a API está no ar.
    """
    return {"message": "Bem-vindo à API da Cida Joias!"}