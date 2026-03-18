"""
StackPair – User service layer.

CRUD, onboarding state machine (§10.6), account lifecycle,
admin operations, and Redis cache invalidation.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.users.models import (
    OnboardingState,
    User,
    UserProfile,
    UserRole,
    UserSocialLink,
)

# ── Onboarding state transitions (§10.6) ───────────────

ONBOARDING_TRANSITIONS: dict[OnboardingState, OnboardingState] = {
    OnboardingState.REGISTERED: OnboardingState.PROFILE_COMPLETE,
    OnboardingState.PROFILE_COMPLETE: OnboardingState.SKILLS_SET,
    OnboardingState.SKILLS_SET: OnboardingState.GOALS_SET,
    OnboardingState.GOALS_SET: OnboardingState.ACTIVE,
}


class UserService:
    """User management business logic."""

    def __init__(self, redis: aioredis.Redis) -> None:
        self.redis = redis

    # ── Reads ───────────────────────────────────────────

    async def get_by_id(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> User | None:
        stmt = (
            select(User)
            .options(selectinload(User.profile), selectinload(User.social_links))
            .where(User.id == user_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_auth_id(
        self, db: AsyncSession, auth_id: uuid.UUID
    ) -> User | None:
        stmt = (
            select(User)
            .options(selectinload(User.profile))
            .where(User.auth_id == auth_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(
        self, db: AsyncSession, username: str
    ) -> User | None:
        stmt = (
            select(User)
            .options(selectinload(User.profile), selectinload(User.social_links))
            .where(User.username == username, User.is_active.is_(True))
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    # ── User profile updates ───────────────────────────

    async def update_user(
        self,
        db: AsyncSession,
        user: User,
        display_name: str | None = None,
        bio: str | None = None,
        avatar_url: str | None = None,
    ) -> User:
        if display_name is not None:
            user.display_name = display_name
        if bio is not None:
            user.bio = bio
        if avatar_url is not None:
            user.avatar_url = avatar_url

        await db.flush()
        await self._invalidate_cache(user.id)
        return user

    async def update_profile(
        self,
        db: AsyncSession,
        user: User,
        primary_skill: str | None = None,
        skill_level: int | None = None,
        secondary_skills: list[str] | None = None,
        goals: list[str] | None = None,
        timezone_str: str | None = None,
        languages: list[str] | None = None,
        linkedin_url: str | None = None,
        portfolio_url: str | None = None,
    ) -> UserProfile:
        # Change 2: Hard block – users cannot set primary_skill or skill_level
        if primary_skill is not None or skill_level is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Primary skill and skill level can only be set by the verification service",
            )

        profile = user.profile
        if not profile:
            profile = UserProfile(user_id=user.id)
            db.add(profile)

        if secondary_skills is not None:
            profile.secondary_skills = secondary_skills
        if goals is not None:
            profile.goals = goals
        if timezone_str is not None:
            profile.timezone = timezone_str
        if languages is not None:
            profile.languages = languages
        if linkedin_url is not None:
            profile.linkedin_url = linkedin_url
        if portfolio_url is not None:
            profile.portfolio_url = portfolio_url

        await db.flush()
        await self._invalidate_cache(user.id)
        return profile

    async def set_primary_skill(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        primary_skill: str,
        skill_level: int,
    ) -> UserProfile:
        """
        Change 2: Internal-only – called by M-02 verification service.
        Sets primary_skill and skill_level on user_profiles.
        """
        stmt = (
            select(UserProfile)
            .where(UserProfile.user_id == user_id)
        )
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)

        profile.primary_skill = primary_skill
        profile.skill_level = skill_level

        await db.flush()
        await self._invalidate_cache(user_id)
        return profile

    async def upsert_social_links(
        self,
        db: AsyncSession,
        user: User,
        links: list[dict],
    ) -> list[UserSocialLink]:
        # Delete existing links for this user
        existing = await db.execute(
            select(UserSocialLink).where(UserSocialLink.user_id == user.id)
        )
        for row in existing.scalars():
            await db.delete(row)

        # Insert new
        new_links = []
        for link in links:
            social = UserSocialLink(
                user_id=user.id,
                platform=link["platform"],
                url=link["url"],
            )
            db.add(social)
            new_links.append(social)

        await db.flush()
        await self._invalidate_cache(user.id)
        return new_links

    # ── Onboarding state machine (§10.6) ───────────────

    async def advance_onboarding(
        self,
        db: AsyncSession,
        user: User,
        expected_current: OnboardingState,
        data: dict | None = None,
    ) -> User:
        """
        Validate the transition and advance onboarding state.
        If the user is not in the expected state, raise HTTP 409.
        """
        if user.onboarding_state != expected_current:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="INVALID_ONBOARDING_STATE",
            )

        next_state = ONBOARDING_TRANSITIONS.get(expected_current)
        if next_state is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="INVALID_ONBOARDING_STATE",
            )

        # Apply data based on the step
        if expected_current == OnboardingState.REGISTERED and data:
            # Step 1: username, display_name, avatar
            if "username" in data:
                # Check uniqueness
                existing = await db.execute(
                    select(User).where(
                        User.username == data["username"],
                        User.id != user.id,
                    )
                )
                if existing.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="USERNAME_TAKEN",
                    )
                user.username = data["username"]
            if "display_name" in data:
                user.display_name = data["display_name"]
            if "avatar_url" in data:
                user.avatar_url = data["avatar_url"]

        elif expected_current == OnboardingState.PROFILE_COMPLETE and data:
            # Step 2: secondary skills only (primary_skill set by M-02)
            profile = user.profile
            if not profile:
                profile = UserProfile(user_id=user.id)
                db.add(profile)
            if "secondary_skills" in data:
                profile.secondary_skills = data["secondary_skills"]

        elif expected_current == OnboardingState.SKILLS_SET and data:
            # Step 3: goals, timezone, languages
            profile = user.profile
            if not profile:
                profile = UserProfile(user_id=user.id)
                db.add(profile)
            if "goals" in data:
                profile.goals = data["goals"]
            if "timezone" in data:
                profile.timezone = data["timezone"]
            if "languages" in data:
                profile.languages = data["languages"]

        user.onboarding_state = next_state
        await db.flush()
        await self._invalidate_cache(user.id)
        return user

    # ── Account deletion (REQ-AUTH-07) ──────────────────

    async def soft_delete_user(
        self, db: AsyncSession, user: User
    ) -> User:
        """Soft-delete: set is_active=False, deleted_at=now()."""
        user.is_active = False
        user.deleted_at = datetime.now(timezone.utc)
        await db.flush()
        await self._invalidate_cache(user.id)
        # TODO: Enqueue Celery task for T+30d hard delete
        return user

    # ── Admin operations ────────────────────────────────

    async def suspend_user(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> User:
        user = await self.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="USER_NOT_FOUND",
            )
        user.is_active = False
        await db.flush()
        await self._invalidate_cache(user.id)
        return user

    async def reinstate_user(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> User:
        user = await self.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="USER_NOT_FOUND",
            )
        user.is_active = True
        user.deleted_at = None
        await db.flush()
        await self._invalidate_cache(user.id)
        return user

    async def update_role(
        self, db: AsyncSession, user_id: uuid.UUID, role: str
    ) -> User:
        user = await self.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="USER_NOT_FOUND",
            )
        try:
            user.role = UserRole(role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}",
            )
        await db.flush()
        await self._invalidate_cache(user.id)
        return user

    async def list_users(
        self,
        db: AsyncSession,
        page: int = 1,
        per_page: int = 20,
        role: str | None = None,
        is_active: bool | None = None,
    ) -> dict:
        stmt = select(User)
        count_stmt = select(func.count(User.id))

        if role:
            stmt = stmt.where(User.role == UserRole(role))
            count_stmt = count_stmt.where(User.role == UserRole(role))
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)
            count_stmt = count_stmt.where(User.is_active == is_active)

        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = (
            stmt.order_by(User.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        result = await db.execute(stmt)
        users = result.scalars().all()

        return {
            "users": users,
            "total": total,
            "page": page,
            "per_page": per_page,
        }

    # ── Cache helpers ───────────────────────────────────

    async def _invalidate_cache(
        self, user_id: uuid.UUID, auth_id: uuid.UUID | None = None
    ) -> None:
        await self.redis.delete(f"user:{user_id}")
        await self.redis.delete(f"profile:{user_id}")
        if auth_id:
            await self.redis.delete(f"user_by_auth:{auth_id}")
