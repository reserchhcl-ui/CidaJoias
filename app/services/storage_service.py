# app/services/storage_service.py

import shutil
import os
import uuid
from fastapi import UploadFile
from pathlib import Path
from ..core.config import settings

class LocalStorageService:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_image(self, file: UploadFile, sub_folder: str = "products") -> str:
        """
        Salva um arquivo de imagem e retorna a URL pública correta.
        """
        if not file.content_type.startswith("image/"):
            raise ValueError("File is not a valid image.")

        # Gerar nome único
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Definir caminho físico (Onde salvar)
        # Ex: E:\CidaJoias\uploads\products\uuid.jpg
        destination_folder = self.upload_dir / sub_folder
        destination_folder.mkdir(parents=True, exist_ok=True)
        destination_path = destination_folder / unique_filename

        try:
            with destination_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        finally:
            file.file.close()

        # --- CORREÇÃO DA URL DE RETORNO ---
        # Se for produto, usa a rota específica que acabamos de criar
        if sub_folder == "products":
            return f"/Produtos_Images/{unique_filename}"
        
        # Fallback para outros tipos de arquivo
        return f"/static/{sub_folder}/{unique_filename}"

    def delete_image(self, image_url: str):
        """Remove o arquivo físico se existir."""
        if not image_url:
            return
            
        # Traduz a URL pública de volta para o caminho do arquivo
        if "/Produtos_Images/" in image_url:
            clean_path = image_url.replace("/Produtos_Images/", "products/")
        else:
            clean_path = image_url.replace("/static/", "")
            
        file_path = self.upload_dir / clean_path
        
        if file_path.exists():
            os.remove(file_path)

storage = LocalStorageService()