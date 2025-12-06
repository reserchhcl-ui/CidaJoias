"""Add payment_status to orders

Revision ID: 87e456d1c8fd
Revises: 03c073a9253c
Create Date: 2025-12-06 18:11:58.985398

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql # <--- Importação Essencial

# revision identifiers, used by Alembic.
revision: str = '87e456d1c8fd'
down_revision: Union[str, Sequence[str], None] = '03c073a9253c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Definir o Enum explicitamente para o PostgreSQL
    # NOTA: Verifique se estes valores ('PENDING', etc) são EXATAMENTE iguais 
    # aos que estão no seu app/models.py (maiúsculas/minúsculas importam!)
    payment_status_enum = postgresql.ENUM('PENDING', 'APPROVED', 'FAILED', 'REFUNDED', name='paymentstatus')
    
    # 2. Criar o tipo no banco de dados
    payment_status_enum.create(op.get_bind(), checkfirst=True)

    # 3. Adicionar as colunas
    # Note que usamos o objeto 'payment_status_enum' que acabamos de criar/definir
    op.add_column('orders', sa.Column('payment_status', payment_status_enum, nullable=False,server_default='PENDING'))
    op.add_column('orders', sa.Column('payment_method', sa.String(length=50), nullable=True))
    op.add_column('orders', sa.Column('transaction_id', sa.String(length=100), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # 1. Remover as colunas primeiro
    op.drop_column('orders', 'transaction_id')
    op.drop_column('orders', 'payment_method')
    op.drop_column('orders', 'payment_status')

    # 2. Remover o tipo Enum do banco de dados
    payment_status_enum = postgresql.ENUM('PENDING', 'APPROVED', 'FAILED', 'REFUNDED', name='paymentstatus')
    payment_status_enum.drop(op.get_bind(), checkfirst=True)