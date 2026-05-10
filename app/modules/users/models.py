"""
StackPair – SQLAlchemy ORM models for M-01 Auth & User Management.

Tables: users, user_profiles, user_social_links, sessions
ENUMs:  user_role, onboarding_state
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    ARRAY,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    SmallInteger,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ── Base ────────────────────────────────────────────────


class Base(DeclarativeBase):
    pass


# ── ENUM types ──────────────────────────────────────────


class UserRole(str, enum.Enum):
    USER = "USER"
    MENTOR = "MENTOR"
    AMBASSADOR = "AMBASSADOR"
    ADMIN = "ADMIN"


class OnboardingState(str, enum.Enum):
    REGISTERED = "REGISTERED"
    PROFILE_COMPLETE = "PROFILE_COMPLETE"
    SKILLS_SET = "SKILLS_SET"
    GOALS_SET = "GOALS_SET"
    ACTIVE = "ACTIVE"


# ── Users table (§6.1) ─────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    auth_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id"),  # Fix 3 – schema-qualified FK
        unique=True,
        nullable=False,
    )
    username: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False
    )
    display_name: Mapped[str] = mapped_column(String(60), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_type=False),
        nullable=False,
        server_default=text("'USER'"),
    )
    onboarding_state: Mapped[OnboardingState] = mapped_column(
        Enum(OnboardingState, name="onboarding_state", create_type=False),
        nullable=False,
        server_default=text("'REGISTERED'"),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    # relationships
    profile: Mapped[UserProfile | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    social_links: Mapped[list[UserSocialLink]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    sessions: Mapped[list[Session]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


# ── User Profiles table (§6.2) ─────────────────────────


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    primary_skill: Mapped[str | None] = mapped_column(String(80), nullable=True)
    secondary_skills: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    skill_level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    github_handle: Mapped[str | None] = mapped_column(String(40), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    languages: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    goals: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    learn_mode_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    build_mode_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    showcase_unlocked: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    inactivity_warnings: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default=text("0")
    )
    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    # relationships
    user: Mapped[User] = relationship(back_populates="profile")


# ── User Social Links table (§6.3) ─────────────────────


class UserSocialLink(Base):
    __tablename__ = "user_social_links"

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
    platform: Mapped[str] = mapped_column(String(40), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    # relationships
    user: Mapped[User] = relationship(back_populates="social_links")


# ── Sessions table (§6.4) ──────────────────────────────


class Session(Base):
    __tablename__ = "sessions"

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
    device_hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address = mapped_column(INET, nullable=True)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    # relationships
    user: Mapped[User] = relationship(back_populates="sessions")
