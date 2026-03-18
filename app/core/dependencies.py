"""
StackPair – FastAPI dependencies for auth & RBAC.

• get_current_user  – validates JWT, checks Redis blacklist, loads user
• require_active    – wraps get_current_user; rejects non-ACTIVE users
• has_role(role)    – factory; returns dependency that asserts a specific role
"""

from __future__ import annotations

import json
import uuid

import jwt
import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.redis import get_redis
from app.modules.users.models import OnboardingState, User, UserRole

bearer_scheme = HTTPBearer()


# ── get_current_user ────────────────────────────────────


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
) -> User:
    """
    Validates the Bearer token and returns the authenticated User.

    Steps (per PRD §10.4):
      1. Check Redis blacklist (revoked tokens).
      2. Decode & validate JWT via PyJWT.
      3. Load user from Redis cache or DB.
    """
    token = credentials.credentials

    # 1. Blacklist check
    if await redis.get(f"blacklist:{token}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="TOKEN_REVOKED",
        )

    # 2. Decode JWT
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="TOKEN_EXPIRED",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="TOKEN_INVALID",
        )

    # 3. Load user (cache → DB)
    auth_id: str | None = payload.get("sub")
    if not auth_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="TOKEN_INVALID",
        )

    cache_key = f"user_by_auth:{auth_id}"
    cached = await redis.get(cache_key)
    if cached:
        data = json.loads(cached)
        stmt = select(User).where(User.id == uuid.UUID(data["id"]))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user

    # Cache miss – query DB
    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .where(User.auth_id == uuid.UUID(auth_id))
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="USER_NOT_FOUND",
        )

    # Cache for 5 minutes
    await redis.setex(
        cache_key,
        300,
        json.dumps({"id": str(user.id), "auth_id": str(user.auth_id)}),
    )
    return user


# ── require_active ──────────────────────────────────────


async def require_active(
    user: User = Depends(get_current_user),
) -> User:
    """
    Fix 1 – Gate that enforces onboarding_state == ACTIVE.

    Applied to all product routes (GET /users/me, PUT /users/me, etc.)
    and all admin routes.  NOT applied to /onboarding/* or /auth/* routes.
    """
    if user.onboarding_state != OnboardingState.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="INVALID_ONBOARDING_STATE",
        )
    return user


# ── has_role ────────────────────────────────────────────


def has_role(required_role: UserRole):
    """
    Factory – returns a FastAPI dependency that checks the user's role.

    Usage:
        @router.post("/admin/...", dependencies=[Depends(has_role(UserRole.ADMIN))])
    """

    async def _check_role(
        user: User = Depends(require_active),  # admin routes also need ACTIVE
    ) -> User:
        if user.role != required_role and user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="INSUFFICIENT_ROLE",
            )
        return user

    return _check_role


# ── verify_internal_token ───────────────────────────────


async def verify_internal_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> None:
    """
    Change 2 – Dependency for /internal/* routes only.

    Checks that the Bearer token exactly matches INTERNAL_SERVICE_TOKEN.
    Used by M-02 verification service to set primary_skill and skill_level.
    """
    if credentials.credentials != settings.internal_service_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal service token",
        )
