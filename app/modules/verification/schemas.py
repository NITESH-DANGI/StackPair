"""
StackPair – M-02 Pydantic schemas for verification endpoints.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Platform handles ───────────────────────────────────


class PlatformHandleItem(BaseModel):
    platform: str = Field(..., max_length=30, description="github, leetcode, kaggle, codeforces, stackoverflow, portfolio")
    handle: str = Field(..., max_length=100, description="Username or URL on the platform")


class SubmitPlatformsRequest(BaseModel):
    handles: list[PlatformHandleItem]


# ── Verification status ─────────────────────────────────


class VerificationStatusResponse(BaseModel):
    status: str
    trigger: str | None = None
    final_score: float | None = None
    assigned_level: int | None = None
    normalised_primary_skill: str | None = None
    started_at: str | None = None
    completed_at: str | None = None


class VerificationRunResponse(BaseModel):
    id: str
    status: str
    trigger: str
    sources_attempted: list[str] | None = None
    sources_succeeded: list[str] | None = None
    raw_scores: dict | None = None
    final_score: float | None = None
    detected_primary_skill: str | None = None
    normalised_primary_skill: str | None = None
    assigned_level: int | None = None
    error_detail: str | None = None
    started_at: str
    completed_at: str | None = None


# ── Admin ────────────────────────────────────────────────


class TriggerBatchRequest(BaseModel):
    user_ids: list[str]


# ── Benchmarks ──────────────────────────────────────────


class BenchmarkResponse(BaseModel):
    id: str
    skill_category: str
    quarter: str
    avg_required_level: float
    min_required_level: int
    max_required_level: int
    jd_sample_size: int
    top_secondary_skills: list[str] | None = None
    created_at: str


# ── Generic ─────────────────────────────────────────────


class MessageResponse(BaseModel):
    message: str
