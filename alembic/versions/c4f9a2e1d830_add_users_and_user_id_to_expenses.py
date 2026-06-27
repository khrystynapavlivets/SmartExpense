"""add users and user_id to expenses

Revision ID: c4f9a2e1d830
Revises: 8bb72ea7d4e5
Create Date: 2026-06-28 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4f9a2e1d830"
down_revision: Union[str, Sequence[str], None] = "8bb72ea7d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.add_column("expenses", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_expenses_user_id"), "expenses", ["user_id"], unique=False)
    op.create_foreign_key(
        "fk_expenses_user_id",
        "expenses",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_expenses_user_id", "expenses", type_="foreignkey")
    op.drop_index(op.f("ix_expenses_user_id"), table_name="expenses")
    op.drop_column("expenses", "user_id")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
