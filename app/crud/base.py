# NOVO ARQUIVO: app/crud/base.py

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import Base

# Define tipos genéricos para o nosso Modelo SQLAlchemy e Schemas Pydantic
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Classe base para operações CRUD com tipos genéricos para
    um modelo SQLAlchemy, um schema de criação e um schema de atualização.
    """
    def __init__(self, model: Type[ModelType]):
        """
        Construtor da classe CRUD.

        :param model: A classe do modelo SQLAlchemy (ex: models.User)
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Busca um único objeto pelo seu ID."""
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Busca múltiplos objetos com paginação."""
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Cria um novo objeto no banco."""
        # Converte o schema Pydantic para um dicionário
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)  # Desempacota o dict no construtor do modelo
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Atualiza um objeto existente no banco."""
        obj_data = db_obj.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            # exclude_unset=True garante que apenas os campos enviados sejam atualizados
            update_data = obj_in.model_dump(exclude_unset=True) 
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> ModelType:
        """Remove um objeto do banco pelo seu ID."""
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj