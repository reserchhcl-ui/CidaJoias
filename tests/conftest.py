# ARQUIVO CORRIGIDO: tests/conftest.py

import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings
from app.main import app
from app.database import Base, get_db

# --- 1. Configuração ---
@pytest.fixture(scope="session", autouse=True)
def override_settings():
    """Força configurações de teste."""
    settings.DATABASE_URL = "sqlite:///./test.db"
    settings.SECRET_KEY = "test-secret"
    settings.API_V1_STR = "/api/v1"
    
    # Limpeza inicial
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass
    
    yield
    
    # A limpeza final será feita, mas se falhar aqui não é crítico,
    # pois a limpeza inicial da próxima execução resolverá.

# --- 2. Engine com Dispose (CORREÇÃO DO WIN ERROR 32) ---
@pytest.fixture(scope="session")
def db_engine(override_settings):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    yield engine
    # CRÍTICO: Fecha todas as conexões do pool para liberar o arquivo no Windows
    engine.dispose()

# --- 3. Setup do Banco ---
@pytest.fixture(scope="session", autouse=True)
def setup_database(db_engine):
    Base.metadata.create_all(bind=db_engine)
    yield
    Base.metadata.drop_all(bind=db_engine)

# --- 4. Sessão por Teste ---
@pytest.fixture(scope="function")
def db(db_engine) -> Generator[Session, None, None]:
    connection = db_engine.connect()
    transaction = connection.begin()
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

# --- 5. Cliente ---
@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()