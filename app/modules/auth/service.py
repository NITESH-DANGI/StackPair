"""
StackPair – Auth service layer.

Handles OTP flow, GitHub OAuth, token refresh, logout,
session tracking (Fix 2), and OTP brute-force protection (§11.1).
"""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from supabase import Client as SupabaseClient

from app.modules.auth.schemas import AuthResponse, UserBrief
from app.modules.auth.utils import blacklist_key, otp_attempts_key
from app.modules.users.models import (
    OnboardingState,
    Session,
    User,
    UserProfile,
    UserRole,
)

# ── Constants ───────────────────────────────────────────

OTP_MAX_ATTEMPTS = 5
OTP_WINDOW_SECONDS = 600  # 10 minutes
USER_CACHE_TTL = 300      # 5 minutes
PROFILE_CACHE_TTL = 600   # 10 minutes


class AuthService:
    """All auth-related business logic."""

    def __init__(
        self,
        supabase: SupabaseClient,
        redis: aioredis.Redis,
    ) -> None:
        self.supabase = supabase
        self.redis = redis

    # ── OTP flow (§10.5) ────────────────────────────────

    async def send_otp(self, email: str) -> dict:
        """
        REQ-AUTH-01: Send a 6-digit OTP to the given email via Supabase.
        """
        # Check rate limit
        await self._check_otp_rate_limit(email)

        try:
            self.supabase.auth.sign_in_with_otp(
                {"email": email, "options": {"should_create_user": True}}
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send OTP: {exc}",
            )

        return {"message": "OTP sent", "expires_in": OTP_WINDOW_SECONDS}

    async def verify_otp(
        self,
        email: str,
        otp: str,
        db: AsyncSession,
        device_hint: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """
        REQ-AUTH-01: Verify the OTP and return JWT pair.
        On first login, creates a user row with onboarding_state=REGISTERED.
        Fix 2: Creates a session record in the sessions table.
        """
        # Rate limit check
        attempts_key = otp_attempts_key(email)
        current_attempts = await self.redis.get(attempts_key)
        if current_attempts and int(current_attempts) >= OTP_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OTP_RATE_LIMITED",
                headers={"Retry-After": str(OTP_WINDOW_SECONDS)},
            )

        try:
            response = self.supabase.auth.verify_otp(
                {"email": email, "token": otp, "type": "email"}
            )
        except Exception:
            # Increment failure counter
            await self.redis.incr(attempts_key)
            await self.redis.expire(attempts_key, OTP_WINDOW_SECONDS)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OTP_INCORRECT",
            )

        # Clear rate limit on success
        await self.redis.delete(attempts_key)

        session_data = response.session
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OTP_EXPIRED",
            )

        auth_id = response.user.id
        access_token = session_data.access_token
        refresh_token = session_data.refresh_token

        # Find or create user
        user = await self._find_or_create_user(
            db=db,
            auth_id=auth_id,
            email=email,
        )

        # Fix 2: Create session record
        await self._create_session_record(
            db=db,
            user_id=user.id,
            device_hint=device_hint,
            ip_address=ip_address,
        )

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600,
            user=UserBrief(
                id=str(user.id),
                email=user.email,
                onboarding_state=user.onboarding_state.value,
                role=user.role.value,
            ),
        )

    # ── GitHub OAuth (§10.5, REQ-AUTH-02) ───────────────

    async def github_oauth_url(self) -> str:
        """
        Generate the GitHub OAuth redirect URL via Supabase.
        Stores a CSRF state token in Redis (§11.3).
        """
        state = secrets.token_urlsafe(32)
        await self.redis.setex(f"oauth_state:{state}", OTP_WINDOW_SECONDS, "1")

        response = self.supabase.auth.sign_in_with_oauth(
            {"provider": "github", "options": {"redirect_to": "", "scopes": "read:user user:email"}}
        )
        # Append state to the URL
        url = response.url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}state={state}"

    async def github_callback(
        self,
        code: str,
        state: str | None,
        db: AsyncSession,
        device_hint: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """
        Handle the GitHub OAuth callback.
        Fix 2: Creates a session record on successful login.
        §11.3: Validates the CSRF state parameter.
        """
        # Validate CSRF state
        if state:
            stored = await self.redis.get(f"oauth_state:{state}")
            if not stored:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired OAuth state",
                )
            await self.redis.delete(f"oauth_state:{state}")

        try:
            response = self.supabase.auth.exchange_code_for_session(
                {"auth_code": code}
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"GitHub OAuth failed: {exc}",
            )

        session_data = response.session
        supabase_user = response.user

        # Extract GitHub handle from user metadata
        github_handle = None
        if supabase_user.user_metadata:
            github_handle = supabase_user.user_metadata.get(
                "user_name"
            ) or supabase_user.user_metadata.get("preferred_username")

        email = supabase_user.email or ""

        # Find or create user
        user = await self._find_or_create_user(
            db=db,
            auth_id=supabase_user.id,
            email=email,
            github_handle=github_handle,
        )

        # Fix 2: Create session record
        await self._create_session_record(
            db=db,
            user_id=user.id,
            device_hint=device_hint,
            ip_address=ip_address,
        )

        return AuthResponse(
            access_token=session_data.access_token,
            refresh_token=session_data.refresh_token,
            expires_in=3600,
            user=UserBrief(
                id=str(user.id),
                email=user.email,
                onboarding_state=user.onboarding_state.value,
                role=user.role.value,
            ),
        )

    # ── Google OAuth (Change 1) ─────────────────────────

    async def google_oauth_url(self) -> str:
        """
        Generate the Google OAuth redirect URL via Supabase.
        Stores a CSRF state token in Redis (same pattern as GitHub).
        """
        from app.core.config import settings as app_settings

        state = secrets.token_urlsafe(32)
        await self.redis.setex(f"oauth_state:{state}", OTP_WINDOW_SECONDS, "1")

        response = self.supabase.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {
                    "redirect_to": app_settings.google_redirect_uri,
                    "scopes": "openid email profile",
                },
            }
        )
        url = response.url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}state={state}"

    async def google_callback(
        self,
        code: str,
        state: str | None,
        db: AsyncSession,
        device_hint: str | None = None,
        ip_address: str | None = None,
    ) -> AuthResponse:
        """
        Handle the Google OAuth callback.
        Creates a session record on successful login.
        Validates the CSRF state parameter.
        """
        # Validate CSRF state
        if state:
            stored = await self.redis.get(f"oauth_state:{state}")
            if not stored:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired OAuth state",
                )
            await self.redis.delete(f"oauth_state:{state}")

        try:
            response = self.supabase.auth.exchange_code_for_session(
                {"auth_code": code}
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google OAuth failed: {exc}",
            )

        session_data = response.session
        supabase_user = response.user
        email = supabase_user.email or ""

        # Find or create user
        user = await self._find_or_create_user(
            db=db,
            auth_id=supabase_user.id,
            email=email,
        )

        # Create session record
        await self._create_session_record(
            db=db,
            user_id=user.id,
            device_hint=device_hint,
            ip_address=ip_address,
        )

        return AuthResponse(
            access_token=session_data.access_token,
            refresh_token=session_data.refresh_token,
            expires_in=3600,
            user=UserBrief(
                id=str(user.id),
                email=user.email,
                onboarding_state=user.onboarding_state.value,
                role=user.role.value,
            ),
        )

    # ── Refresh (REQ-AUTH-03) ───────────────────────────

    async def refresh_session(
        self,
        refresh_token_str: str,
        db: AsyncSession,
        user_id: uuid.UUID | None = None,
    ) -> dict:
        """
        Refresh an access token via Supabase.
        Fix 2: Updates last_seen_at on the active session row.
        """
        try:
            response = self.supabase.auth.refresh_session(refresh_token_str)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Refresh failed: {exc}",
            )

        session_data = response.session

        # Fix 2: Update last_seen_at on the user's active session
        if user_id:
            await self._update_session_last_seen(db, user_id)

        return {
            "access_token": session_data.access_token,
            "refresh_token": session_data.refresh_token,
            "token_type": "Bearer",
            "expires_in": 3600,
        }

    # ── Logout ──────────────────────────────────────────

    async def logout(
        self,
        token: str,
        user_id: uuid.UUID,
        db: AsyncSession,
        token_ttl: int = 3600,
    ) -> None:
        """
        Revoke the current access token.
        Fix 2: Sets revoked_at on the most recent active session.
        """
        # Blacklist the access token in Redis for its remaining TTL
        await self.redis.setex(blacklist_key(token), token_ttl, "1")

        # Invalidate user cache
        await self._invalidate_user_cache(user_id)

        # Fix 2: Revoke most recent active session
        now = datetime.now(timezone.utc)
        stmt = (
            select(Session)
            .where(Session.user_id == user_id, Session.revoked_at.is_(None))
            .order_by(Session.created_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        session_row = result.scalar_one_or_none()
        if session_row:
            session_row.revoked_at = now

    async def logout_all(
        self,
        token: str,
        user_id: uuid.UUID,
        db: AsyncSession,
        token_ttl: int = 3600,
    ) -> None:
        """
        Revoke all sessions.
        Fix 2: Sets revoked_at on ALL active sessions for this user.
        """
        # Blacklist the current token
        await self.redis.setex(blacklist_key(token), token_ttl, "1")

        # Fix 2: Revoke all active sessions in DB
        now = datetime.now(timezone.utc)
        stmt = (
            update(Session)
            .where(Session.user_id == user_id, Session.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await db.execute(stmt)

        # Invalidate user cache
        await self._invalidate_user_cache(user_id)

    # ── Private helpers ─────────────────────────────────

    async def _find_or_create_user(
        self,
        db: AsyncSession,
        auth_id: str,
        email: str,
        github_handle: str | None = None,
    ) -> User:
        """Look up user by auth_id; create on first login."""
        stmt = select(User).where(User.auth_id == uuid.UUID(auth_id))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            return user

        # First login — create user + empty profile
        user = User(
            auth_id=uuid.UUID(auth_id),
            username=f"user_{secrets.token_hex(4)}",  # temp username
            display_name="New User",
            email=email,
            role=UserRole.USER,
            onboarding_state=OnboardingState.REGISTERED,
        )
        db.add(user)
        await db.flush()

        profile = UserProfile(
            user_id=user.id,
            github_handle=github_handle,
        )
        db.add(profile)
        await db.flush()

        return user

    async def _create_session_record(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        device_hint: str | None = None,
        ip_address: str | None = None,
    ) -> Session:
        """
        Fix 2: Write a new row to the sessions table on every login.
        """
        session_row = Session(
            user_id=user_id,
            device_hint=device_hint[:200] if device_hint else None,
            ip_address=ip_address,
        )
        db.add(session_row)
        await db.flush()
        return session_row

    async def _update_session_last_seen(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> None:
        """Fix 2: Update last_seen_at on the user's most recent active session."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(Session)
            .where(Session.user_id == user_id, Session.revoked_at.is_(None))
            .order_by(Session.created_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        session_row = result.scalar_one_or_none()
        if session_row:
            session_row.last_seen_at = now

    async def _check_otp_rate_limit(self, email: str) -> None:
        """§11.1: Check if the email is locked from OTP requests."""
        attempts_key = otp_attempts_key(email)
        current = await self.redis.get(attempts_key)
        if current and int(current) >= OTP_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OTP_RATE_LIMITED",
                headers={"Retry-After": str(OTP_WINDOW_SECONDS)},
            )

    async def _invalidate_user_cache(self, user_id: uuid.UUID) -> None:
        """Clear user and profile caches."""
        await self.redis.delete(f"user:{user_id}")
        await self.redis.delete(f"profile:{user_id}")
