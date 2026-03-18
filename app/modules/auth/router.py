"""
StackPair – Auth router.

All 7 auth routes per PRD §7.1.
Base path: /auth (mounted at /api/v1 by main.py).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import create_client

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.redis import get_redis
from app.modules.auth.schemas import (
    AuthResponse,
    GitHubCallbackRequest,
    GitHubOAuthURL,
    MessageResponse,
    OAuthCallbackRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyOTPRequest,
)
from app.modules.auth.service import AuthService
from app.modules.users.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


async def _get_auth_service(redis=Depends(get_redis)) -> AuthService:
    supabase = create_client(settings.supabase_url, settings.supabase_service_key)
    return AuthService(supabase=supabase, redis=redis)


def _client_info(request: Request) -> dict:
    """Extract device hint and IP from the request."""
    return {
        "device_hint": request.headers.get("user-agent", "")[:200],
        "ip_address": request.client.host if request.client else None,
    }


# ── POST /auth/register ────────────────────────────────


@router.post("/register", response_model=RegisterResponse)
async def register(
    body: RegisterRequest,
    service: AuthService = Depends(_get_auth_service),
):
    result = await service.send_otp(body.email)
    return result


# ── POST /auth/verify-otp ──────────────────────────────


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(
    body: VerifyOTPRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(_get_auth_service),
):
    info = _client_info(request)
    return await service.verify_otp(
        email=body.email,
        otp=body.otp,
        db=db,
        device_hint=info["device_hint"],
        ip_address=info["ip_address"],
    )


# ── POST /auth/github ──────────────────────────────────


@router.post("/github", response_model=GitHubOAuthURL)
async def github_oauth(
    service: AuthService = Depends(_get_auth_service),
):
    url = await service.github_oauth_url()
    return GitHubOAuthURL(url=url)


# ── POST /auth/github/callback ─────────────────────────


@router.post("/github/callback", response_model=AuthResponse)
async def github_callback(
    body: GitHubCallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(_get_auth_service),
):
    info = _client_info(request)
    return await service.github_callback(
        code=body.code,
        state=body.state,
        db=db,
        device_hint=info["device_hint"],
        ip_address=info["ip_address"],
    )


# ── POST /auth/google ──────────────────────────────────


@router.post("/google", response_model=GitHubOAuthURL)
async def google_oauth(
    service: AuthService = Depends(_get_auth_service),
):
    url = await service.google_oauth_url()
    return GitHubOAuthURL(url=url)


# ── POST /auth/google/callback ─────────────────────────


@router.post("/google/callback", response_model=AuthResponse)
async def google_callback(
    body: OAuthCallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(_get_auth_service),
):
    info = _client_info(request)
    return await service.google_callback(
        code=body.code,
        state=body.state,
        db=db,
        device_hint=info["device_hint"],
        ip_address=info["ip_address"],
    )


# ── POST /auth/refresh ─────────────────────────────────


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(_get_auth_service),
):
    return await service.refresh_session(
        refresh_token_str=body.refresh_token,
        db=db,
    )


# ── POST /auth/logout ──────────────────────────────────


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(_get_auth_service),
    user: User = Depends(get_current_user),
):
    token = request.headers.get("authorization", "").removeprefix("Bearer ")
    await service.logout(token=token, user_id=user.id, db=db)
    return MessageResponse(message="Logged out successfully")


# ── POST /auth/logout-all ──────────────────────────────


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    request: Request,
    db: AsyncSession = Depends(get_db),
    service: AuthService = Depends(_get_auth_service),
    user: User = Depends(get_current_user),
):
    token = request.headers.get("authorization", "").removeprefix("Bearer ")
    await service.logout_all(token=token, user_id=user.id, db=db)
    return MessageResponse(message="All sessions revoked")
