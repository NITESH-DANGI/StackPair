"""
StackPair – Users / Onboarding / Admin router.

All routes from PRD §7.2–7.4.
Base path: mounted at /api/v1 by main.py.

Fix 1: Product routes and admin routes use `require_active`.
       Onboarding routes use plain `get_current_user` (ungated).
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, has_role, require_active, verify_internal_token
from app.core.redis import get_redis
from app.modules.users.models import OnboardingState, User, UserRole
from app.modules.users.schemas import (
    InternalSkillUpdateRequest,
    MessageResponse,
    OnboardingGoalsRequest,
    OnboardingProfileRequest,
    OnboardingSkillsRequest,
    OnboardingStateResponse,
    UpdateProfileRequest,
    UpdateRoleRequest,
    UpdateUserRequest,
    UpsertSocialLinksRequest,
    UserMeResponse,
    UserPublicResponse,
    ProfileResponse,
)
from app.modules.users.service import UserService

router = APIRouter(tags=["Users"])


def _get_user_service(redis=Depends(get_redis)) -> UserService:
    return UserService(redis=redis)


# ═══════════════════════════════════════════════════════
#  PROFILE ROUTES – gated with require_active (Fix 1)
# ═══════════════════════════════════════════════════════


@router.get("/users/me", response_model=UserMeResponse)
async def get_me(
    user: User = Depends(require_active),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """GET /users/me – full profile (§7.2)."""
    full_user = await service.get_by_id(db, user.id)
    return _build_user_me_response(full_user or user)


@router.put("/users/me", response_model=UserMeResponse)
async def update_me(
    body: UpdateUserRequest,
    user: User = Depends(require_active),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """PUT /users/me – update display name, bio, avatar (§7.2)."""
    updated = await service.update_user(
        db=db,
        user=user,
        display_name=body.display_name,
        bio=body.bio,
        avatar_url=body.avatar_url,
    )
    return _build_user_me_response(updated)


@router.get("/users/me/profile", response_model=ProfileResponse)
async def get_my_profile(
    user: User = Depends(require_active),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """GET /users/me/profile – skill profile (§7.2)."""
    full_user = await service.get_by_id(db, user.id)
    if full_user and full_user.profile:
        return ProfileResponse.model_validate(full_user.profile)
    return ProfileResponse()


@router.put("/users/me/profile", response_model=ProfileResponse)
async def update_my_profile(
    body: UpdateProfileRequest,
    user: User = Depends(require_active),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """PUT /users/me/profile – update secondary skills, goals, links (§7.2)."""
    profile = await service.update_profile(
        db=db,
        user=user,
        secondary_skills=body.secondary_skills,
        goals=body.goals,
        timezone_str=body.timezone,
        languages=body.languages,
        linkedin_url=body.linkedin_url,
        portfolio_url=body.portfolio_url,
    )
    return ProfileResponse.model_validate(profile)


@router.put("/users/me/social-links", response_model=MessageResponse)
async def update_social_links(
    body: UpsertSocialLinksRequest,
    user: User = Depends(require_active),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """PUT /users/me/social-links – upsert social links (§7.2)."""
    await service.upsert_social_links(
        db=db,
        user=user,
        links=[link.model_dump() for link in body.links],
    )
    return MessageResponse(message="Social links updated")


@router.get("/users/{username}", response_model=UserPublicResponse)
async def get_user_by_username(
    username: str,
    user: User = Depends(require_active),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """GET /users/:username – public profile, no email (§7.2, §11.4)."""
    from fastapi import HTTPException, status as http_status

    target = await service.get_by_username(db, username)
    if not target:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="USER_NOT_FOUND",
        )
    return _build_user_public_response(target)


@router.delete("/users/me", response_model=MessageResponse)
async def delete_me(
    user: User = Depends(require_active),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """DELETE /users/me – soft delete (§7.2, REQ-AUTH-07)."""
    await service.soft_delete_user(db, user)
    return MessageResponse(message="Account deletion initiated. Data will be purged in 30 days.")


# ═══════════════════════════════════════════════════════
#  ONBOARDING ROUTES – use get_current_user only (NOT gated)
# ═══════════════════════════════════════════════════════


@router.get("/onboarding/state", response_model=OnboardingStateResponse)
async def get_onboarding_state(
    user: User = Depends(get_current_user),
):
    """GET /onboarding/state (§7.3)."""
    return OnboardingStateResponse(onboarding_state=user.onboarding_state.value)


@router.post("/onboarding/profile", response_model=OnboardingStateResponse)
async def onboarding_profile(
    body: OnboardingProfileRequest,
    user: User = Depends(get_current_user),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """POST /onboarding/profile – step 1 (§7.3, §10.6)."""
    updated = await service.advance_onboarding(
        db=db,
        user=user,
        expected_current=OnboardingState.REGISTERED,
        data=body.model_dump(),
    )
    return OnboardingStateResponse(onboarding_state=updated.onboarding_state.value)


@router.post("/onboarding/skills", response_model=OnboardingStateResponse)
async def onboarding_skills(
    body: OnboardingSkillsRequest,
    user: User = Depends(get_current_user),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """POST /onboarding/skills – step 2 (§7.3, §10.6)."""
    updated = await service.advance_onboarding(
        db=db,
        user=user,
        expected_current=OnboardingState.PROFILE_COMPLETE,
        data=body.model_dump(),
    )
    return OnboardingStateResponse(onboarding_state=updated.onboarding_state.value)


@router.post("/onboarding/goals", response_model=OnboardingStateResponse)
async def onboarding_goals(
    body: OnboardingGoalsRequest,
    user: User = Depends(get_current_user),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """POST /onboarding/goals – step 3 (§7.3, §10.6)."""
    updated = await service.advance_onboarding(
        db=db,
        user=user,
        expected_current=OnboardingState.SKILLS_SET,
        data=body.model_dump(),
    )
    return OnboardingStateResponse(onboarding_state=updated.onboarding_state.value)


@router.post("/onboarding/complete", response_model=OnboardingStateResponse)
async def onboarding_complete(
    user: User = Depends(get_current_user),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """POST /onboarding/complete – finalise → ACTIVE (§7.3, §10.6)."""
    updated = await service.advance_onboarding(
        db=db,
        user=user,
        expected_current=OnboardingState.GOALS_SET,
    )
    return OnboardingStateResponse(onboarding_state=updated.onboarding_state.value)


# ═══════════════════════════════════════════════════════
#  ADMIN ROUTES – gated with require_active + has_role(ADMIN)  (Fix 1)
# ═══════════════════════════════════════════════════════


@router.post("/admin/users/{user_id}/suspend", response_model=MessageResponse)
async def admin_suspend_user(
    user_id: uuid.UUID,
    _admin: User = Depends(has_role(UserRole.ADMIN)),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """POST /admin/users/:id/suspend (§7.4)."""
    await service.suspend_user(db, user_id)
    return MessageResponse(message="User suspended")


@router.post("/admin/users/{user_id}/reinstate", response_model=MessageResponse)
async def admin_reinstate_user(
    user_id: uuid.UUID,
    _admin: User = Depends(has_role(UserRole.ADMIN)),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """POST /admin/users/:id/reinstate (§7.4)."""
    await service.reinstate_user(db, user_id)
    return MessageResponse(message="User reinstated")


@router.post("/admin/users/{user_id}/role", response_model=MessageResponse)
async def admin_update_role(
    user_id: uuid.UUID,
    body: UpdateRoleRequest,
    _admin: User = Depends(has_role(UserRole.ADMIN)),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """POST /admin/users/:id/role (§7.4)."""
    await service.update_role(db, user_id, body.role)
    return MessageResponse(message=f"Role updated to {body.role}")


@router.get("/admin/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
    _admin: User = Depends(has_role(UserRole.ADMIN)),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """GET /admin/users – list with filters + pagination (§7.4)."""
    return await service.list_users(
        db=db, page=page, per_page=per_page, role=role, is_active=is_active
    )


# ═══════════════════════════════════════════════════════
#  Response builders
# ═══════════════════════════════════════════════════════


def _build_user_me_response(user: User) -> UserMeResponse:
    profile_data = None
    if user.profile:
        profile_data = ProfileResponse.model_validate(user.profile)
    return UserMeResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        email=user.email,
        avatar_url=user.avatar_url,
        bio=user.bio,
        role=user.role.value,
        onboarding_state=user.onboarding_state.value,
        profile=profile_data,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )


def _build_user_public_response(user: User) -> UserPublicResponse:
    profile_data = None
    if user.profile:
        profile_data = ProfileResponse.model_validate(user.profile)
    return UserPublicResponse(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        role=user.role.value,
        profile=profile_data,
    )


# ═══════════════════════════════════════════════════════
#  INTERNAL ROUTES – gated with verify_internal_token (Change 2)
# ═══════════════════════════════════════════════════════


@router.put("/internal/users/{user_id}/skill-level", response_model=MessageResponse)
async def internal_set_skill_level(
    user_id: uuid.UUID,
    body: InternalSkillUpdateRequest,
    _token: None = Depends(verify_internal_token),
    service: UserService = Depends(_get_user_service),
    db: AsyncSession = Depends(get_db),
):
    """PUT /internal/users/:id/skill-level – M-02 verification service only."""
    await service.set_primary_skill(
        db=db,
        user_id=user_id,
        primary_skill=body.primary_skill,
        skill_level=body.skill_level,
    )
    return MessageResponse(message="Primary skill and skill level updated")
