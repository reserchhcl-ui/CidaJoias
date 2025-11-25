# NOVO ARQUIVO: tests/integration/test_image_upload.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import os
from app.core.config import settings
from tests.utils.product import create_random_product
from tests.utils.user import create_user_and_get_headers

def test_admin_can_upload_product_image(client: TestClient, db: Session):
    # 1. Preparação
    admin_headers = create_user_and_get_headers(db, client, is_admin=True)
    product = create_random_product(db)
    
    # Criar um arquivo dummy em memória
    file_content = b"fake image content"
    files = {"file": ("test_image.jpg", file_content, "image/jpeg")}

    # 2. Act
    response = client.post(
        f"{settings.API_V1_STR}/products/{product.id}/image",
        headers=admin_headers,
        files=files
    )

    # 3. Assert
    assert response.status_code == 200
    data = response.json()
    
    # Verifica se a URL foi gerada corretamente
    assert "static/products/" in data["image_url"]
    assert data["image_url"].endswith(".jpg")
    
    # Verifica se o arquivo foi realmente criado no disco
    relative_path = data["image_url"].replace("/static/", "")
    full_path = os.path.join(settings.UPLOAD_DIR, relative_path)
    assert os.path.exists(full_path)
    
    # Limpeza (Teardown) - remover o arquivo criado
    os.remove(full_path)

def test_upload_invalid_file_type(client: TestClient, db: Session):
    admin_headers = create_user_and_get_headers(db, client, is_admin=True)
    product = create_random_product(db)
    
    # Enviar um arquivo de texto em vez de imagem
    files = {"file": ("virus.exe", b"malware", "application/x-msdownload")}

    response = client.post(
        f"{settings.API_V1_STR}/products/{product.id}/image",
        headers=admin_headers,
        files=files
    )

    assert response.status_code == 400
    assert "not a valid image" in response.json()["detail"]