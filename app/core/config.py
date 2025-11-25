# ARQUIVO CORRIGIDO: app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional
import os
class Settings(BaseSettings):
    """
    Configurações da aplicação.
    Lê variáveis de ambiente automaticamente.
    """
    # Permite ler do arquivo .env e ignora variáveis extras não mapeadas
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    # --- Identidade da API ---
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Cida Joias E-commerce"

    # --- Segurança (JWT) ---
    SECRET_KEY: str = "troque_isso_em_producao_por_uma_hash_segura"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- Banco de Dados (PostgreSQL) ---
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "84141039"
    POSTGRES_DB: str = "CidaJoias-db"
    POSTGRES_PORT: int = 5432
    # --- Configurações de Mídia ---
    UPLOAD_DIR: str = "uploads" # Diretório local para salvar imagens
    BASE_URL: str = "http://localhost:8000" # Usado para gerar a URL completa da imagem
    # Definimos DATABASE_URL como Optional[str] para que possa ser sobrescrito.
    # Se for None, será calculado pelo validator.
    DATABASE_URL: Optional[str] = None

    @model_validator(mode='after')
    def compute_database_url(self) -> 'Settings':
        """
        Se DATABASE_URL não foi definido (ex: via env var ou teste),
        monta a URL padrão do PostgreSQL usando os campos acima.
        """
        if self.DATABASE_URL is None:
            self.DATABASE_URL = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        return self

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)