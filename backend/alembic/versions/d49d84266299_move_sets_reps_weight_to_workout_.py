"""move sets reps weight to workout exercise

Revision ID: d49d84266299
Revises: c6ff45aca119
Create Date: 2026-08-19 11:10:20.487334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd49d84266299'
down_revision: Union[str, Sequence[str], None] = 'c6ff45aca119'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('workout_exercises') as batch_op:
        batch_op.add_column(sa.Column('sets', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('reps', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('weight', sa.Float(), nullable=True))

    bind = op.get_bind()

    exercises = sa.table(
        'exercises',
        sa.column('id', sa.Integer),
        sa.column('sets', sa.Integer),
        sa.column('reps', sa.Integer),
        sa.column('weight', sa.Float),
    )
    workout_exercises = sa.table(
        'workout_exercises',
        sa.column('exercise_id', sa.Integer),
        sa.column('sets', sa.Integer),
        sa.column('reps', sa.Integer),
        sa.column('weight', sa.Float),
    )

    for ex_id, ex_sets, ex_reps, ex_weight in bind.execute(
        sa.select(exercises.c.id, exercises.c.sets, exercises.c.reps, exercises.c.weight)
    ):
        bind.execute(
            workout_exercises.update()
            .where(workout_exercises.c.exercise_id == ex_id)
            .values(sets=ex_sets, reps=ex_reps, weight=ex_weight)
        )

    with op.batch_alter_table('workout_exercises') as batch_op:
        batch_op.alter_column('sets', nullable=False)
        batch_op.alter_column('reps', nullable=False)
        batch_op.alter_column('weight', nullable=False)

    with op.batch_alter_table('exercises') as batch_op:
        batch_op.drop_column('sets')
        batch_op.drop_column('reps')
        batch_op.drop_column('weight')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('exercises') as batch_op:
        batch_op.add_column(sa.Column('sets', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('reps', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('weight', sa.Float(), nullable=True))

    bind = op.get_bind()

    exercises = sa.table(
        'exercises',
        sa.column('id', sa.Integer),
        sa.column('sets', sa.Integer),
        sa.column('reps', sa.Integer),
        sa.column('weight', sa.Float),
    )
    workout_exercises = sa.table(
        'workout_exercises',
        sa.column('exercise_id', sa.Integer),
        sa.column('sets', sa.Integer),
        sa.column('reps', sa.Integer),
        sa.column('weight', sa.Float),
    )

    seen = set()
    for ex_id, we_sets, we_reps, we_weight in bind.execute(
        sa.select(
            workout_exercises.c.exercise_id,
            workout_exercises.c.sets,
            workout_exercises.c.reps,
            workout_exercises.c.weight,
        )
    ):
        if ex_id in seen:
            continue
        seen.add(ex_id)
        bind.execute(
            exercises.update()
            .where(exercises.c.id == ex_id)
            .values(sets=we_sets, reps=we_reps, weight=we_weight)
        )

    # Exercícios sem nenhum workout_exercise (nunca usados em um treino) não têm de onde
    # herdar valores — preenche com um padrão pra satisfazer a constraint NOT NULL.
    bind.execute(
        exercises.update()
        .where(exercises.c.sets.is_(None))
        .values(sets=3, reps=12, weight=0)
    )

    with op.batch_alter_table('exercises') as batch_op:
        batch_op.alter_column('sets', nullable=False, server_default='3')
        batch_op.alter_column('reps', nullable=False, server_default='12')
        batch_op.alter_column('weight', nullable=False, server_default='0')

    with op.batch_alter_table('workout_exercises') as batch_op:
        batch_op.drop_column('sets')
        batch_op.drop_column('reps')
        batch_op.drop_column('weight')
