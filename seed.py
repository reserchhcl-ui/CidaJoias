# seed.py
import sys
import os

# Adiciona o diretório atual ao path para importar os módulos do app
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app import models
from app.security import get_password_hash
from decimal import Decimal

def seed():
    db = SessionLocal()
    print("🌱 Iniciando o seed do banco de dados...")

    # --- 1. Criar Categorias ---
    categories_data = [
        {"name": "Colares", "slug": "colares"},
        {"name": "Brincos", "slug": "brincos"},
        {"name": "Pulseiras", "slug": "pulseiras"},
        {"name": "Anéis", "slug": "aneis"},
        {"name": "Conjuntos", "slug": "conjuntos"},
    ]
    
    created_cats = []
    for cat_data in categories_data:
        existing = db.query(models.Category).filter_by(slug=cat_data["slug"]).first()
        if not existing:
            cat = models.Category(**cat_data)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            created_cats.append(cat)
            print(f"✅ Categoria criada: {cat.name}")
        else:
            created_cats.append(existing)
            print(f"ℹ️ Categoria já existe: {existing.name}")

    # --- 2. Criar Usuário Admin ---
    admin_email = "admin@cidajoias.com"
    existing_admin = db.query(models.User).filter_by(email=admin_email).first()
    if not existing_admin:
        admin = models.User(
            email=admin_email,
            hashed_password=get_password_hash("pBNMX9UcCffFCpC2y"), # Senha: admin123
            role="admin",
        )
        db.add(admin)
        db.commit()
        print(f"✅ Admin criado: {admin_email} (Senha: pBNMX9UcCFCpC2y)")
    else:
        print(f"ℹ️ Admin já existe: {admin_email}")

    # --- 3. Criar Produtos de Exemplo ---
    if created_cats:
        products_data = [
            {
                "name": "Colar Ponto de Luz",
                "description": "Colar delicado com zircônia cristal, banhado a ouro 18k.",
                "selling_price": Decimal("89.90"),
                "cost_price": Decimal("35.00"),
                "stock_quantity": 10,
                "category_id": created_cats[0].id, # Colares
                "image_url": "/static/products/colar-luz.jpg",
            },
            {
                "name": "Brinco Argola Cravejada",
                "description": "Argola média cravejada com micro zircônias.",
                "selling_price": Decimal("129.90"),
                "cost_price": Decimal("45.00"),
                "stock_quantity": 5,
                "category_id": created_cats[1].id, # Brincos
                "image_url": "/static/products/argola.jpg",
            },
            {
                "name": "Pulseira Riviera",
                "description": "Pulseira estilo riviera ajustável, ideal para festas.",
                "selling_price": Decimal("199.90"),
                "cost_price": Decimal("80.00"),
                "stock_quantity": 3,
                "category_id": created_cats[2].id, # Pulseiras
                "image_url": None,
            }
        ]

        for prod_data in products_data:
            # Verifica se já existe produto com este nome para não duplicar no seed
            if not db.query(models.Product).filter_by(name=prod_data["name"]).first():
                prod = models.Product(**prod_data)
                db.add(prod)
                print(f"✅ Produto criado: {prod.name}")
        
        db.commit()

    db.close()
    print("✨ Seed concluído com sucesso!")

if __name__ == "__main__":
    seed()