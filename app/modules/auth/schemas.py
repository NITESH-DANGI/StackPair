"""
StackPair – Auth module Pydantic schemas.

Request / response contracts per PRD §8.
"""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


# ── Register ────────────────────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr


class RegisterResponse(BaseModel):
    message: str = "OTP sent"
    expires_in: int = 600


# ── Verify OTP ──────────────────────────────────────────


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class UserBrief(BaseModel):
    id: str
    email: str
    onboarding_state: str
    role: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    user: UserBrief


# ── Refresh ─────────────────────────────────────────────


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600


# ── GitHub OAuth ────────────────────────────────────────


class GitHubOAuthURL(BaseModel):
    url: str


class GitHubCallbackRequest(BaseModel):
    code: str
    state: str | None = None


# ── Generic ─────────────────────────────────────────────


class MessageResponse(BaseModel):
    message: str
