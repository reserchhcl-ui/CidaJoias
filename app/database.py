# ARQUIVO: app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Configuração para PostgreSQL
# pool_pre_ping=True ajuda a evitar erros de conexão perdida
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependência que fornece uma sessão de banco de dados.
    Garante o fechamento da conexão ao final da requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



