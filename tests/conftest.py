# ARQUIVO ATUALIZADO: tests/conftest.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,Session
from typing import Generator

# --- 1. Monkeypatch das Configurações ANTES de importar a app ---
# Usamos a biblioteca de monkeypatch do pytest para substituir
# as configurações ANTES que a aplicação as leia.
@pytest.fixture(scope="session", autouse=True)
def override_settings():
    from app.core.config import settings
    # Substitui a URL do banco de dados em memória por uma URL de teste
    settings.DATABASE_URL = "sqlite:///./test.db"
    # Você pode sobrescrever outras configs aqui se necessário para os testes
    settings.SECRET_KEY = "test-secret"

# Agora que as settings foram sobrescritas, podemos importar o resto com segurança
from app.main import app
from app.database import Base, get_db

# --- 2. Configuração do Banco de Dados de Teste ---
# O engine agora lê a URL já sobrescrita
from app.core.config import settings
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- 3. Fixtures do Pytest (quase inalteradas) ---

@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Fixture para criar uma sessão de banco de dados limpa para cada teste."""
    # Garante que o motor use as tabelas do Base da nossa app
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator:
    """Fixture para criar um TestClient com a dependência do DB sobrescrita."""
    
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)

    app.dependency_overrides.clear()