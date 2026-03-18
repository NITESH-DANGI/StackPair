"""M-01-001 – Create auth ENUMs, tables, indexes, and triggers.

Revision ID: m01_001
Revises: None
Create Date: 2026-03-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, INET, ARRAY

# revision identifiers
revision: str = "m01_001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Create ENUM types ────────────────────────────
    user_role = sa.Enum(
        "USER", "MENTOR", "AMBASSADOR", "ADMIN",
        name="user_role",
    )
    user_role.create(op.get_bind(), checkfirst=True)

    onboarding_state = sa.Enum(
        "REGISTERED", "PROFILE_COMPLETE", "SKILLS_SET", "GOALS_SET", "ACTIVE",
        name="onboarding_state",
    )
    onboarding_state.create(op.get_bind(), checkfirst=True)

    # ── 2. Create tables ────────────────────────────────

    # users (§6.1)
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        # Fix 3 – explicit schema-qualified FK to auth.users
        sa.Column("auth_id", UUID(as_uuid=True), sa.ForeignKey("auth.users.id"), unique=True, nullable=False),
        sa.Column("username", sa.String(30), unique=True, nullable=False),
        sa.Column("display_name", sa.String(60), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("role", user_role, nullable=False, server_default=sa.text("'USER'")),
        sa.Column("onboarding_state", onboarding_state, nullable=False, server_default=sa.text("'REGISTERED'")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="public",
    )

    # user_profiles (§6.2)
    op.create_table(
        "user_profiles",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("public.users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("primary_skill", sa.String(80), nullable=True),
        sa.Column("secondary_skills", ARRAY(sa.Text), nullable=True),
        sa.Column("skill_level", sa.SmallInteger, nullable=True),
        sa.Column("github_handle", sa.String(40), nullable=True),
        sa.Column("linkedin_url", sa.Text, nullable=True),
        sa.Column("portfolio_url", sa.Text, nullable=True),
        sa.Column("timezone", sa.String(60), nullable=True),
        sa.Column("languages", ARRAY(sa.Text), nullable=True),
        sa.Column("goals", ARRAY(sa.Text), nullable=True),
        sa.Column("learn_mode_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("build_mode_active", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("showcase_unlocked", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="public",
    )

    # user_social_links (§6.3)
    op.create_table(
        "user_social_links",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(40), nullable=False),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="public",
    )

    # sessions (§6.4)
    op.create_table(
        "sessions",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_hint", sa.Text, nullable=True),
        sa.Column("ip_address", INET, nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="public",
    )

    # ── 3. Create indexes ───────────────────────────────
    op.create_index("ix_users_email", "users", ["email"], unique=True, schema="public")
    op.create_index("ix_users_username", "users", ["username"], unique=True, schema="public")
    op.create_index("ix_users_auth_id", "users", ["auth_id"], unique=True, schema="public")
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"], unique=True, schema="public")
    op.create_index("ix_user_social_links_user_id", "user_social_links", ["user_id"], schema="public")
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"], schema="public")

    # ── 4. Create updated_at trigger function ───────────
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Attach trigger to users
    op.execute("""
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)

    # Attach trigger to user_profiles
    op.execute("""
        CREATE TRIGGER trg_user_profiles_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;")
    op.execute("DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column();")

    # Drop indexes
    op.drop_index("ix_sessions_user_id", table_name="sessions", schema="public")
    op.drop_index("ix_user_social_links_user_id", table_name="user_social_links", schema="public")
    op.drop_index("ix_user_profiles_user_id", table_name="user_profiles", schema="public")
    op.drop_index("ix_users_auth_id", table_name="users", schema="public")
    op.drop_index("ix_users_username", table_name="users", schema="public")
    op.drop_index("ix_users_email", table_name="users", schema="public")

    # Drop tables (reverse order of creation)
    op.drop_table("sessions", schema="public")
    op.drop_table("user_social_links", schema="public")
    op.drop_table("user_profiles", schema="public")
    op.drop_table("users", schema="public")

    # Drop ENUMs
    sa.Enum(name="onboarding_state").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=True)
