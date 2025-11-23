import csv
import sys
import os
from decimal import Decimal

# Adiciona o diretório atual ao path para importar o 'app'
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product

def clean_price(price_str):
    """Converte strings como 'R$ 89,00' ou '17,8' para float."""
    if not price_str:
        return 0.0
    cleaned = price_str.replace('R$', '').replace('%', '').strip()
    if '.' in cleaned and ',' in cleaned:
        cleaned = cleaned.replace('.', '')
    cleaned = cleaned.replace(',', '.')
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def import_from_csv(file_path: str):
    db: Session = SessionLocal()
    
    # Conjunto para rastrear IDs duplicados DENTRO do arquivo CSV atual
    seen_ids_in_file = set()

    try:
        print(f"--- Iniciando importação de: {file_path} ---")
        
        with open(file_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            count_success = 0
            count_skip = 0
            
            for i, row in enumerate(reader, start=2): # Começa do 2 considerando o cabeçalho
                # 1. Tratamento do ID (Barcode)
                old_id = row.get('Id_Produto', '').strip()
                
                # CORREÇÃO CRÍTICA 1: Ignorar linhas com ID vazio
                if not old_id:
                    print(f"⚠️ Linha {i}: Pular - ID do produto está vazio.")
                    count_skip += 1
                    continue

                # CORREÇÃO CRÍTICA 2: Ignorar duplicatas no próprio CSV
                if old_id in seen_ids_in_file:
                    print(f"⚠️ Linha {i}: Pular - ID duplicado no arquivo ({old_id}).")
                    count_skip += 1
                    continue
                
                seen_ids_in_file.add(old_id)

                # Verifica se já existe no Banco de Dados
                existing_product = db.query(Product).filter(Product.barcode == old_id).first()
                if existing_product:
                    print(f"ℹ️ Linha {i}: Pular - Produto {old_id} já existe no banco.")
                    count_skip += 1
                    continue

                # 2. Mapeamento dos outros dados
                sku_name = row.get('Nome do Produto', '').strip()
                category = row.get('Tipo do Produto', '').strip()
                description_text = row.get('Descrição', '').strip()
                
                final_name = description_text if description_text else sku_name or f"Produto {old_id}"
                final_description = f"Código: {sku_name} | Tipo: {category} | Descrição: {description_text}"
                
                cost = clean_price(row.get('Preço de Custo'))
                sale = clean_price(row.get('Preço de Venda'))
                
                try:
                    qty = int(row.get('Quantidade em Estoque', 0))
                except:
                    qty = 0
                
                raw_img = row.get('Imagem do Produto', '').strip()
                if raw_img:
                    final_image_url = f"/{raw_img.replace('\\', '/')}"
                else:
                    final_image_url = f"https://placehold.co/600x400?text={old_id}"

                # 3. Criação do Objeto
                new_product = Product(
                    name=final_name,
                    description=final_description,
                    cost_price=Decimal(cost),
                    selling_price=Decimal(sale),
                    stock_quantity=qty,
                    on_loan_quantity=0,
                    barcode=old_id,
                    image_url=final_image_url
                )
                
                db.add(new_product)
                count_success += 1

                # Opcional: Commit parcial a cada 1000 produtos para não sobrecarregar a memória
                if count_success % 1000 == 0:
                    db.commit()
                    print(f"--- Parcial: {count_success} produtos salvos ---")

            # Commit final para o restante
            db.commit()
            print("------------------------------------------------")
            print(f"✅ Importação Concluída!")
            print(f"📦 Novos produtos inseridos: {count_success}")
            print(f"⏩ Produtos pulados (vazios/duplicados): {count_skip}")

    except Exception as e:
        print(f"❌ ERRO FATAL durante a importação: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    csv_filename = "produtos.csv"
    if os.path.exists(csv_filename):
        import_from_csv(csv_filename)
    else:
        print(f"Arquivo '{csv_filename}' não encontrado.")