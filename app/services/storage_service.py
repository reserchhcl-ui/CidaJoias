# NOVO ARQUIVO: app/services/storage_service.py

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
        Salva um arquivo de imagem, gera um nome único e retorna a URL relativa.
        """
        # 1. Sanitização e validação básica
        if not file.content_type.startswith("image/"):
            raise ValueError("File is not a valid image.")

        # 2. Gerar nome único (UUID) para evitar colisão e problemas com nomes de arquivo originais
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # 3. Definir caminho final
        destination_folder = self.upload_dir / sub_folder
        destination_folder.mkdir(parents=True, exist_ok=True)
        destination_path = destination_folder / unique_filename

        # 4. Salvar o conteúdo (Streaming para não estourar memória)
        try:
            with destination_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        finally:
            file.file.close()

        # 5. Retornar URL relativa para salvar no banco
        # Ex: /static/products/d290f1ee-6c54-4b01-90e6-d701748f0851.jpg
        return f"/static/{sub_folder}/{unique_filename}"

    def delete_image(self, image_url: str):
        """Remove o arquivo físico se existir."""
        # Converte URL (/static/...) para caminho de arquivo (uploads/...)
        if not image_url:
            return
            
        clean_path = image_url.replace("/static/", "")
        file_path = self.upload_dir / clean_path
        
        if file_path.exists():
            os.remove(file_path)

# Instância padrão (Single Source of Truth)
storage = LocalStorageService()