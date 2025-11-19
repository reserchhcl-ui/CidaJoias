"""Refatoracao do modelo de precos com cost_price, selling_price e tabela de descontos

Revision ID: b29c7dfcd4be
Revises: a27048dbe44e
Create Date: 2025-11-17 16:36:13.979448

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b29c7dfcd4be'
down_revision: Union[str, Sequence[str], None] = 'a27048dbe44e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### Início dos comandos CORRIGIDOS E MANUAIS ###
    
    # 1. Cria a nova tabela 'discounts' (O seu código 'autogenerate' estava correto aqui)
    op.create_table('discounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('discount_price', sa.DECIMAL(precision=10, scale=2), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_discounts_product_id'), 'discounts', ['product_id'], unique=False)

    # 2. Adiciona a nova coluna 'cost_price'
    #    CORREÇÃO: Adiciona 'server_default' para evitar 'NotNullViolation'
    op.add_column('products', 
                  sa.Column('cost_price', 
                            sa.DECIMAL(precision=10, scale=2), 
                            nullable=False, 
                            server_default='0.0'))

    # 3. RENOMEIA 'price' para 'selling_price' (Ação NÃO-DESTRUTIVA)
    #    Isto preserva todos os dados de preços existentes.
    op.alter_column('products', 
                    'price', 
                    new_column_name='selling_price',
                    existing_type=sa.DECIMAL(precision=10, scale=2),
                    nullable=False) # Assumindo que 'price' já era NOT NULL

    # ### Fim dos comandos ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### Início dos comandos CORRIGIDOS E MANUAIS ###

    # 1. Renomeia 'selling_price' DE VOLTA para 'price'
    op.alter_column('products', 
                    'selling_price', 
                    new_column_name='price',
                    existing_type=sa.DECIMAL(precision=10, scale=2),
                    nullable=False)

    # 2. Remove a coluna 'cost_price'
    op.drop_column('products', 'cost_price')

    # 3. Remove a tabela 'discounts'
    op.drop_index(op.f('ix_discounts_product_id'), table_name='discounts')
    op.drop_table('discounts')
    
    # ### Fim dos comandos ###