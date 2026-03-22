"""
StackPair – M-02 ORM models for Verification Engine.

Tables: verification_runs, user_platform_handles, skill_benchmarks
ENUM:   verify_status
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    ARRAY,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modules.users.models import Base


# ── ENUM ────────────────────────────────────────────────


class VerifyStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


# ── verification_runs (§5.1) ───────────────────────────


class VerificationRun(Base):
    __tablename__ = "verification_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[VerifyStatus] = mapped_column(
        Enum(VerifyStatus, name="verify_status", create_type=False),
        nullable=False,
        server_default=text("'PENDING'"),
    )
    trigger: Mapped[str] = mapped_column(String(20), nullable=False)

    sources_attempted: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    sources_succeeded: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    raw_scores: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    final_score: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    detected_primary_skill: Mapped[str | None] = mapped_column(
        String(80), nullable=True
    )
    normalised_primary_skill: Mapped[str | None] = mapped_column(
        String(80), nullable=True
    )
    assigned_level: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True
    )
    error_detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # relationships
    user = relationship("User", backref="verification_runs")


# ── user_platform_handles (§5.2) ───────────────────────


class UserPlatformHandle(Base):
    __tablename__ = "user_platform_handles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform: Mapped[str] = mapped_column(String(30), nullable=False)
    handle: Mapped[str] = mapped_column(String(100), nullable=False)
    verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    last_checked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # relationships
    user = relationship("User", backref="platform_handles")


# ── skill_benchmarks (§5.3) ────────────────────────────


class SkillBenchmark(Base):
    __tablename__ = "skill_benchmarks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    skill_category: Mapped[str] = mapped_column(String(80), nullable=False)
    quarter: Mapped[str] = mapped_column(String(7), nullable=False)
    avg_required_level: Mapped[Decimal] = mapped_column(
        Numeric(3, 1), nullable=False
    )
    min_required_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    max_required_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    jd_sample_size: Mapped[int] = mapped_column(Integer, nullable=False)
    top_secondary_skills: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
