# app/routers/products_admin.py

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List

from ..services.pricing_engine import PricingEngine
from ..services.storage_service import storage
from .. import models, schemas, auth, crud
from ..database import get_db

# Router Administrativo
router = APIRouter(
    prefix="/backoffice/products",
    tags=["Products (Admin)"],
    # Segurança Global: Todas as rotas aqui exigem ser Admin ou SalesRep (para leitura)
    # Refinaremos rota a rota quem pode escrever.
)
def get_pricing_engine(db: Session = Depends(get_db)):
    return PricingEngine(db=db)
# --- UTILITÁRIOS E ESTATÍSTICAS ---
@router.get("/", response_model=List[schemas.Product])
def read_products(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Lista produtos disponíveis para venda.
    Oculta dados sensíveis (preço de custo, fornecedor).
    """
    products_from_db = crud.product.get_multi(db, skip=skip, limit=limit)
    current_prices = pricing_engine.get_current_prices_for_products(products=products_from_db)
    
    results = []
    for product in products_from_db:
        # Monta o objeto de resposta injetando o preço calculado e a categoria
        p_data = product.__dict__.copy()
        p_data["current_price"] = current_prices.get(product.id, product.selling_price)
        
        if product.category:
            p_data["category"] = product.category
            
        results.append(p_data)
    return results

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_user)
):
    """(Admin) Cria novo produto completo."""
    if product.barcode and crud.product.get_by_barcode(db, barcode=product.barcode):
        raise HTTPException(status_code=400, detail="Barcode already registered")
    
    new_product = crud.product.create(db=db, obj_in=product)
    
    p_data = new_product.__dict__.copy()
    p_data["current_price"] = new_product.selling_price
    p_data["id"] = new_product.id
    return p_data

@router.get("/stats/inventory", response_model=schemas.InventoryStats)
def get_inventory_statistics(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_user)
):
    """(Admin) Dashboard de Estoque e Valores."""
    return crud.product.get_inventory_stats(db)


@router.get("/generate-barcode", response_model=schemas.BarcodeResponse)
def get_unique_barcode(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """(Admin) Gera código único para cadastro."""
    code = crud.product.generate_unique_barcode(db)
    return {"barcode": code}

# --- CRUD COMPLETO ---
@router.get("/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """Detalhes de um produto específico para o cliente."""
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    pricing_engine = PricingEngine(db)
    current_price = pricing_engine.get_current_price_for_product(product=db_product)
    
    p_data = db_product.__dict__.copy()
    p_data["current_price"] = current_price
    return p_data



@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """(Admin) Atualiza produto existente."""
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = crud.product.update(db=db, db_obj=db_product, obj_in=product_update)
    
    # Recalcula preço para exibir corretamente na resposta
    pricing_engine = PricingEngine(db)
    p_data = updated_product.__dict__.copy()
    p_data["current_price"] = pricing_engine.get_current_price_for_product(product=updated_product)
    return p_data

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """(Admin) Remove produto do catálogo."""
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    crud.product.remove(db=db, id=product_id)
    return None

# --- IMAGENS ---

@router.post("/{product_id}/image", response_model=schemas.Product)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.require_admin_user)
):
    """(Admin) Upload de foto do produto."""
    product = crud.product.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        image_url = storage.save_image(file, sub_folder="products")
        
        if product.image_url:
            storage.delete_image(product.image_url)

        updated_product = crud.product.update(db, db_obj=product, obj_in={"image_url": image_url})
        
        pricing_engine = PricingEngine(db)
        p_data = updated_product.__dict__.copy()
        p_data["current_price"] = pricing_engine.get_current_price_for_product(product=updated_product)
        return p_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- CONSULTA INTERNA (Para Vendedoras/Admin) ---

@router.get("/barcode/{barcode}", response_model=schemas.Product)
def read_product_by_barcode_internal(
    barcode: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin_or_sales_rep)
):
    """
    Busca interna por código de barras.
    Retorna o schema 'Product' completo (incluindo custos), diferente da busca pública.
    """
    db_product = crud.product.get_by_barcode(db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    pricing_engine = PricingEngine(db)
    p_data = db_product.__dict__.copy()
    p_data["current_price"] = pricing_engine.get_current_price_for_product(product=db_product)
    return p_data