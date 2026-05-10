"""M-02-001 – verification_runs, user_platform_handles, skill_benchmarks,
verify_status ENUM, and new columns on user_profiles.

Revision ID: m02_001
Revises: m01_001
Create Date: 2026-03-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

# revision identifiers
revision: str = "m02_001"
down_revision: Union[str, None] = "m01_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Create verify_status ENUM ────────────────────
    verify_status = sa.Enum(
        "PENDING", "RUNNING", "COMPLETE", "FAILED", "SKIPPED",
        name="verify_status",
    )
    verify_status.create(op.get_bind(), checkfirst=True)

    # ── 2. verification_runs table ──────────────────────
    op.create_table(
        "verification_runs",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", verify_status, nullable=False, server_default=sa.text("'PENDING'")),
        sa.Column("trigger", sa.String(20), nullable=False),
        sa.Column("sources_attempted", ARRAY(sa.Text), nullable=True),
        sa.Column("sources_succeeded", ARRAY(sa.Text), nullable=True),
        sa.Column("raw_scores", JSONB, nullable=True),
        sa.Column("final_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("detected_primary_skill", sa.String(80), nullable=True),
        sa.Column("normalised_primary_skill", sa.String(80), nullable=True),
        sa.Column("assigned_level", sa.SmallInteger, nullable=True),
        sa.Column("error_detail", sa.Text, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        schema="public",
    )

    # ── 3. user_platform_handles table ──────────────────
    op.create_table(
        "user_platform_handles",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(30), nullable=False),
        sa.Column("handle", sa.String(100), nullable=False),
        sa.Column("verified", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        schema="public",
    )

    # ── 4. skill_benchmarks table ───────────────────────
    op.create_table(
        "skill_benchmarks",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("skill_category", sa.String(80), nullable=False),
        sa.Column("quarter", sa.String(7), nullable=False),
        sa.Column("avg_required_level", sa.Numeric(3, 1), nullable=False),
        sa.Column("min_required_level", sa.SmallInteger, nullable=False),
        sa.Column("max_required_level", sa.SmallInteger, nullable=False),
        sa.Column("jd_sample_size", sa.Integer, nullable=False),
        sa.Column("top_secondary_skills", ARRAY(sa.Text), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        schema="public",
    )

    # ── 5. Add columns to user_profiles ─────────────────
    op.add_column("user_profiles", sa.Column(
        "inactivity_warnings", sa.SmallInteger, nullable=False, server_default=sa.text("0"),
    ), schema="public")
    op.add_column("user_profiles", sa.Column(
        "last_verified_at", sa.DateTime(timezone=True), nullable=True,
    ), schema="public")

    # ── 6. Create indexes ──────────────────────────────
    op.create_index("ix_verification_runs_user_id", "verification_runs", ["user_id"], schema="public")
    op.create_index("ix_verification_runs_status", "verification_runs", ["status"], schema="public")
    op.create_index("ix_user_platform_handles_user_id", "user_platform_handles", ["user_id"], schema="public")
    op.create_index(
        "ix_user_platform_handles_user_platform",
        "user_platform_handles",
        ["user_id", "platform"],
        unique=True,
        schema="public",
    )
    op.create_index("ix_skill_benchmarks_category_quarter", "skill_benchmarks", ["skill_category", "quarter"], unique=True, schema="public")


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_skill_benchmarks_category_quarter", table_name="skill_benchmarks", schema="public")
    op.drop_index("ix_user_platform_handles_user_platform", table_name="user_platform_handles", schema="public")
    op.drop_index("ix_user_platform_handles_user_id", table_name="user_platform_handles", schema="public")
    op.drop_index("ix_verification_runs_status", table_name="verification_runs", schema="public")
    op.drop_index("ix_verification_runs_user_id", table_name="verification_runs", schema="public")

    # Drop columns from user_profiles
    op.drop_column("user_profiles", "last_verified_at", schema="public")
    op.drop_column("user_profiles", "inactivity_warnings", schema="public")

    # Drop tables
    op.drop_table("skill_benchmarks", schema="public")
    op.drop_table("user_platform_handles", schema="public")
    op.drop_table("verification_runs", schema="public")

    # Drop ENUM
    sa.Enum(name="verify_status").drop(op.get_bind(), checkfirst=True)
