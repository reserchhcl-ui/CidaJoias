# ARQUIVO ATUALIZADO: app/crud/crud_user.py

from sqlalchemy.orm import Session
from typing import Optional

from .base import CRUDBase
from ..models import User
from ..schemas import UserCreate, ProductUpdate # Usando um schema genérico para update por enquanto
from ..security import get_password_hash

class CRUDUser(CRUDBase[User, UserCreate, ProductUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Busca um usuário pelo seu email, que é um campo único."""
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        Sobrescreve o método 'create' para lidar com o hashing da senha
        antes de salvar o usuário no banco de dados.
        """
        # Converte o Pydantic model para um dict, mas exclui o campo 'password'
        # para que ele não seja salvo em texto plano.
        user_data = obj_in.model_dump(exclude={"password"})
        
        # Cria o objeto do modelo SQLAlchemy
        db_obj = self.model(
            **user_data,
            hashed_password=get_password_hash(obj_in.password)
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Cria uma instância única que será usada em toda a aplicação.
# Isso nos permite importar 'user' diretamente, em vez da classe 'CRUDUser'.
user = CRUDUser(User)