import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Pega a URL do banco de dados do ambiente
DATABASE_URL = os.getenv("DATABASE_URL")

# Cria o "motor" (engine) do SQLAlchemy
engine = create_engine(DATABASE_URL)

# Cria uma "fábrica" de sessões (SessionLocal)
# Esta sessão será usada em cada pedido (request) à API
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# Cria uma classe Base para nossos modelos (ORM)
Base = declarative_base()