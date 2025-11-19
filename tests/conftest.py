# VERSÃO FINAL E CORRETA: tests/conftest.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# --- 1. Monkeypatch das Configurações ---
@pytest.fixture(scope="session", autouse=True)
def override_settings():
    from app.core.config import settings
    settings.DATABASE_URL = "sqlite:///./test.db"
    settings.SECRET_KEY = "test-secret"
    # Definir um prefixo para a API é uma boa prática
    settings.API_V1_STR = "/api/v1" # Deixando vazio por enquanto para corresponder aos testes atuais

# --- Importações Pós-Configuração ---
from app.main import app
from app.database import Base, get_db
from app.core.config import settings

# --- 2. Configuração do Banco de Dados de Teste ---
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- 3. Fixtures do Pytest ---

# RENOMEAMOS A FIXTURE DE 'db_session' PARA 'db'
@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    Cria uma sessão de banco de dados limpa para cada teste.
    Esta fixture agora se chama 'db', correspondendo ao que os testes pedem.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db_instance = TestingSessionLocal()
    try:
        yield db_instance
    finally:
        db_instance.close()

# A FIXTURE 'client' AGORA DEPENDE DA FIXTURE 'db'
@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Cria um TestClient que usa a sessão de banco de dados da fixture 'db'.
    """
    
    def override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()