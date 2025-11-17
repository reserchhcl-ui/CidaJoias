# NOVO ARQUIVO: app/core/config.py

from pydantic_settings import BaseSettings,SettingsConfigDict 

class Settings(BaseSettings):
    """
    Classe de configurações da aplicação, carregada a partir de variáveis de ambiente.
    """
    # --- Configurações do Banco de Dados ---
    # O Pydantic automaticamente tentará carregar a variável de ambiente DATABASE_URL.
    # Podemos fornecer um valor padrão para segurança.
    DATABASE_URL: str = "sqlite:///./default.db"

    # --- Configurações de JWT (Autenticação) ---
    SECRET_KEY: str = "super-secret-key-that-should-be-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

        # O nome do arquivo .env a ser procurado
    #env_file = ".env"
    #model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)
        # Permite que as variáveis de ambiente sejam case-insensitive
    model_config = SettingsConfigDict(case_sensitive=True)

# Criamos uma instância única das configurações que será usada em toda a aplicação.
# O Pydantic fará o trabalho de ler o .env e popular o objeto.
settings = Settings()