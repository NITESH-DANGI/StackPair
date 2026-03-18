"""
StackPair – User & Onboarding Pydantic schemas.

Covers profile, onboarding, and admin request/response models.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


# ── Profile response ────────────────────────────────────


class ProfileResponse(BaseModel):
    primary_skill: str | None = None
    skill_level: int | None = None
    secondary_skills: list[str] | None = None
    goals: list[str] | None = None
    timezone: str | None = None
    github_handle: str | None = None
    linkedin_url: str | None = None
    portfolio_url: str | None = None
    languages: list[str] | None = None
    learn_mode_active: bool = True
    build_mode_active: bool = False
    showcase_unlocked: bool = False

    class Config:
        from_attributes = True


class UserMeResponse(BaseModel):
    id: str
    username: str
    display_name: str
    email: str
    avatar_url: str | None = None
    bio: str | None = None
    role: str
    onboarding_state: str
    profile: ProfileResponse | None = None
    created_at: str

    class Config:
        from_attributes = True


class UserPublicResponse(BaseModel):
    """Public profile – email is NEVER returned (§11.4)."""
    id: str
    username: str
    display_name: str
    avatar_url: str | None = None
    bio: str | None = None
    role: str
    profile: ProfileResponse | None = None

    class Config:
        from_attributes = True


# ── Update requests ─────────────────────────────────────


class UpdateUserRequest(BaseModel):
    display_name: str | None = Field(None, min_length=2, max_length=60)
    bio: str | None = Field(None, max_length=300)
    avatar_url: str | None = None


class UpdateProfileRequest(BaseModel):
    secondary_skills: list[str] | None = Field(None, max_length=5)
    goals: list[str] | None = None
    timezone: str | None = Field(None, max_length=60)
    languages: list[str] | None = None
    linkedin_url: str | None = None
    portfolio_url: str | None = None


class SocialLinkItem(BaseModel):
    platform: str = Field(..., max_length=40)
    url: str


class UpsertSocialLinksRequest(BaseModel):
    links: list[SocialLinkItem]


# ── Onboarding requests ────────────────────────────────


class OnboardingProfileRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-z0-9_]+$")
    display_name: str = Field(..., min_length=2, max_length=60)
    avatar_url: str | None = None


class OnboardingSkillsRequest(BaseModel):
    secondary_skills: list[str] | None = Field(None, max_length=5)


class InternalSkillUpdateRequest(BaseModel):
    """Only used by M-02 verification service via /internal/* endpoint."""
    primary_skill: str = Field(..., max_length=80)
    skill_level: int = Field(..., ge=0, le=5)


class OnboardingGoalsRequest(BaseModel):
    goals: list[str]
    timezone: str = Field(..., max_length=60)
    languages: list[str] | None = None


# ── Admin ───────────────────────────────────────────────


class UpdateRoleRequest(BaseModel):
    role: str  # USER | MENTOR | AMBASSADOR | ADMIN


class UserListParams(BaseModel):
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)
    role: str | None = None
    is_active: bool | None = None


# ── Generic ─────────────────────────────────────────────


class MessageResponse(BaseModel):
    message: str


class OnboardingStateResponse(BaseModel):
    onboarding_state: str
