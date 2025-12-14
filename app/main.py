# app/main.py

import os
from fastapi import FastAPI,APIRouter,Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from .core.config import settings
from . import auth, crud, schemas, security, database
from .routers import (products, 
                      products_admin,
                      users, 
                      orders,
                      orders_admin, 
                      sales_cases,
                      sales_cases_admin, 
                      discounts, 
                      recommendations, 
                      categories, 
                      coupons, 
                      addresses ,
                      shipping, 
                      payments)

app = FastAPI(
    title="Cida Joias API",
    description="Back-end."
)


products_upload_dir = os.path.join(settings.UPLOAD_DIR, "products")
os.makedirs(products_upload_dir, exist_ok=True)

origins = [
    "http://localhost:3000",      # Next.js (Web)
    "http://localhost:8081",      # Expo (Mobile - Porta padrão)
    "http://127.0.0.1:3000",
    "http://192.168.0.113:3000",
    "http://localhost:19000", # Expo
    "http://localhost:19006"
    "*"     # Alternativa localhost
]


app.mount("/Produtos_Images", StaticFiles(directory=products_upload_dir), name="product_images")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Lista de origens permitidas
    allow_credentials=True,       # Permite cookies/headers de autenticação
    allow_methods=["*"],          # Permite todos os métodos (GET, POST, PUT, DELETE...)
    allow_headers=["*"],          # Permite todos os headers (Authorization, Content-Type...)
)

api_router = APIRouter(prefix=settings.API_V1_STR)
@api_router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """Endpoint dedicado para login e obtenção de token."""
    user = crud.user.get_by_email(db, email=form_data.username)
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # --- VERIFICAÇÃO DE STATUS ---
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    # -----------------------------
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")
# 2. Incluir os routers na nossa aplicação principal
api_router.include_router(users.router)
api_router.include_router(products.router)
api_router.include_router(products_admin.router)
api_router.include_router(orders_admin.router)
api_router.include_router(categories.router)
api_router.include_router(orders.router)
api_router.include_router(sales_cases.router)
api_router.include_router(sales_cases_admin.router)
api_router.include_router(discounts.router)
api_router.include_router(coupons.router)
api_router.include_router(recommendations.router)
api_router.include_router(addresses.router)
api_router.include_router(shipping.router)
api_router.include_router(payments.router)

app.include_router(api_router)
@app.get("/")
def read_root():
    """
    Endpoint raiz. Apenas diz 'Olá' para confirmar que a API está no ar.
    """
    return {"message": "Bem-vindo à API da Cida Joias!"}

