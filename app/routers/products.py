from fastapi import APIRouter, Depends, HTTPException, status,File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from ..services.pricing_engine import PricingEngine
from ..services.storage_service import storage
from .. import models, schemas, auth, crud
from ..database import get_db

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

def get_pricing_engine(db: Session = Depends(get_db)):
    return PricingEngine(db=db)

@router.post("/search", response_model=List[schemas.Product])
def search_products(
    filter_params: schemas.ProductFilter,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    """
    Busca avançada de produtos utilizando múltiplos critérios.
    """
    # 1. Busca filtrada no banco
    products_from_db = crud.product.get_multi_filtered(
        db, 
        filter_params=filter_params, 
        skip=skip, 
        limit=limit
    )
    
    # 2. Cálculo de preços (Pricing Engine)
    current_prices = pricing_engine.get_current_prices_for_products(products=products_from_db)
    
    # 3. Montagem da resposta
    results = []
    for product in products_from_db:
        p_data = product.__dict__.copy()
        p_data["current_price"] = current_prices.get(product.id, product.selling_price)
        
        # SQLAlchemy às vezes não carrega a relação no __dict__ simples, garantimos aqui
        if product.category:
            p_data["category"] = product.category
            
        results.append(p_data)
        
    return results
# --- LEITURA (GET) - PÚBLICO ---

# ADIÇÃO: operation_id="read_products" força o nome 'readProducts' no Frontend
@router.get("/", response_model=List[schemas.Product])
def read_products(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    pricing_engine: PricingEngine = Depends(get_pricing_engine)
):
    products_from_db = crud.product.get_multi(db, skip=skip, limit=limit)
    current_prices = pricing_engine.get_current_prices_for_products(products=products_from_db)
    results = []
    for product in products_from_db:
        p_data = {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "selling_price": product.selling_price,
            "cost_price": product.cost_price,
            "stock_quantity": product.stock_quantity,
            "on_loan_quantity": product.on_loan_quantity,
            "barcode": product.barcode,
            "image_url": product.image_url,
            "current_price": current_prices.get(product.id, product.selling_price),
            "category_id": product.category_id # Inclui category_id
        }
        # Se carregamos via lazy loading ou eager loading no get_multi
        if product.category:
             p_data["category"] = product.category

        results.append(p_data)
    return results

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    pricing_engine = PricingEngine(db)
    current_price = pricing_engine.get_current_price_for_product(product=db_product)
    
    p_data = db_product.__dict__.copy()
    p_data["current_price"] = current_price
    return p_data

@router.get("/barcode/{barcode}", response_model=schemas.Product)
def read_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    db_product = crud.product.get_by_barcode(db, barcode=barcode)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    pricing_engine = PricingEngine(db)
    p_data = db_product.__dict__.copy()
    p_data["current_price"] = pricing_engine.get_current_price_for_product(product=db_product)
    return p_data

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product_endpoint(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    if crud.product.get_by_barcode(db, barcode=product.barcode):
        raise HTTPException(status_code=400, detail="Barcode already registered")
    
    new_product = crud.product.create(db=db, obj_in=product) # Use obj_in para corresponder ao CRUDBase
    
    p_data = new_product.__dict__.copy()
    p_data["current_price"] = new_product.selling_price
    p_data["id"] = new_product.id
    return p_data

@router.put("/{product_id}", response_model=schemas.Product)
def update_product_endpoint(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    db_product = crud.product.get(db=db, id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = crud.product.update(db=db, db_obj=db_product, obj_in=product_update)
    
    pricing_engine = PricingEngine(db)
    p_data = updated_product.__dict__.copy()
    p_data["current_price"] = pricing_engine.get_current_price_for_product(product=updated_product)
    return p_data

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_endpoint(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user)
):
    crud.product.remove(db=db, id=product_id)
    return None

@router.post("/{product_id}/image", response_model=schemas.Product)
def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user) # Apenas Admin
):
    """
    Faz upload de uma imagem para um produto.
    Se o produto já tiver imagem, ela será substituída e a antiga apagada do disco.
    """
    # 1. Buscar Produto
    product = crud.product.get(db, id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        # 2. Salvar nova imagem
        image_url = storage.save_image(file, sub_folder="products")
        
        # 3. (Opcional) Limpar imagem antiga para não acumular lixo
        if product.image_url:
            storage.delete_image(product.image_url)

        # 4. Atualizar referência no banco
        crud.product.update(db, db_obj=product, obj_in={"image_url": image_url})
        
        # 5. Recarregar para retornar com o campo atualizado
        db.refresh(product)
        
        # Injetar preço atual (Pricing Engine) para manter o contrato do Schema
        pricing_engine = PricingEngine(db)
        p_data = product.__dict__.copy()
        p_data["current_price"] = pricing_engine.get_current_price_for_product(product=product)
        return p_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))