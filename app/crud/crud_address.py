# app/crud/crud_address.py

from typing import List
from sqlalchemy.orm import Session
from .base import CRUDBase
from ..models import Address
from ..schemas import AddressCreate, AddressUpdate

class CRUDAddress(CRUDBase[Address, AddressCreate, AddressUpdate]):
    
    def _unset_other_defaults(self, db: Session, user_id: int, exclude_id: int = None):
        """
        Helper privado: Remove o flag is_default de todos os outros endereços do usuário.
        """
        query = db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.is_default == True
        )
        if exclude_id:
            query = query.filter(self.model.id != exclude_id)
            
        existing_defaults = query.all()
        for address in existing_defaults:
            address.is_default = False
            db.add(address)
        # Não fazemos commit aqui, deixamos para o método principal

    def create(self, db: Session, *, obj_in: AddressCreate, user_id: int) -> Address:
        # Se este for marcado como padrão, desmarca os outros
        if obj_in.is_default:
            self._unset_other_defaults(db, user_id)
        
        # Verifica se é o primeiro endereço do usuário (se for, força default)
        count = db.query(self.model).filter(self.model.user_id == user_id).count()
        if count == 0:
            obj_in.is_default = True

        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Address, obj_in: AddressUpdate) -> Address:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        # Se estivermos atualizando para True
        if update_data.get("is_default"):
            self._unset_other_defaults(db, user_id=db_obj.user_id, exclude_id=db_obj.id)

        return super().update(db, db_obj=db_obj, obj_in=obj_in)

    def get_multi_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Address]:
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(self.model.is_default.desc(), self.model.id.desc()) # Default primeiro
            .offset(skip)
            .limit(limit)
            .all()
        )

address = CRUDAddress(Address)