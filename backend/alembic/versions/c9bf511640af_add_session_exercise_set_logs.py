"""add session exercise set logs

Revision ID: c9bf511640af
Revises: d49d84266299
Create Date: 2026-08-19 11:45:12.186827

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9bf511640af'
down_revision: Union[str, Sequence[str], None] = 'd49d84266299'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'session_exercise_set_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('session_exercise_log_id', sa.Integer(), sa.ForeignKey('session_exercise_logs.id'), nullable=False),
        sa.Column('set_number', sa.Integer(), nullable=False),
        sa.Column('weight_used', sa.Float(), nullable=False),
        sa.Column('reps_used', sa.Integer(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('session_exercise_set_logs')
