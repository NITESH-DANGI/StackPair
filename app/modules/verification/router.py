"""
StackPair – M-02 verification router.

All 8 endpoints per §6 of the PRD:
  Internal:  trigger, status, runs
  Admin:     trigger-batch, benchmarks, benchmark-refresh
  User:      submit platforms, verification-status
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import has_role, require_active, verify_internal_token
from app.modules.users.models import User, UserRole
from app.modules.verification.models import (
    SkillBenchmark,
    UserPlatformHandle,
    VerificationRun,
    VerifyStatus,
)
from app.modules.verification.schemas import (
    BenchmarkResponse,
    MessageResponse,
    SubmitPlatformsRequest,
    TriggerBatchRequest,
    VerificationRunResponse,
    VerificationStatusResponse,
)

router = APIRouter(tags=["Verification"])


# Auth guards reused from app.core.dependencies:
#   verify_internal_token  — for /internal/* routes
#   has_role(UserRole.ADMIN) — for /admin/* routes
#   require_active          — for user routes (JWT + ACTIVE)
_require_admin = has_role(UserRole.ADMIN)


# ══════════════════════════════════════════════════════════
# INTERNAL ENDPOINTS (INTERNAL_SERVICE_TOKEN)
# ══════════════════════════════════════════════════════════


@router.post(
    "/internal/verification/trigger/{user_id}",
    response_model=MessageResponse,
)
async def trigger_verification(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_internal_token),
):
    """POST /internal/verification/trigger/{user_id} — manually trigger verification."""
    # Check user exists
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")

    # Check for already-running verification
    stmt = select(VerificationRun).where(
        VerificationRun.user_id == user_id,
        VerificationRun.status == VerifyStatus.RUNNING,
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="VERIFICATION_ALREADY_RUNNING")

    from app.modules.verification.tasks import verify_user_skill
    verify_user_skill.delay(str(user_id), trigger="manual")
    return MessageResponse(message=f"Verification triggered for user {user_id}")


@router.get(
    "/internal/verification/status/{user_id}",
    response_model=VerificationStatusResponse,
)
async def get_verification_status(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_internal_token),
):
    """GET /internal/verification/status/{user_id} — latest run status."""
    stmt = (
        select(VerificationRun)
        .where(VerificationRun.user_id == user_id)
        .order_by(desc(VerificationRun.started_at))
        .limit(1)
    )
    result = await db.execute(stmt)
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="NO_VERIFICATION_RUN")

    return VerificationStatusResponse(
        status=run.status.value,
        trigger=run.trigger,
        final_score=float(run.final_score) if run.final_score else None,
        assigned_level=run.assigned_level,
        normalised_primary_skill=run.normalised_primary_skill,
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
    )


@router.get(
    "/internal/verification/runs/{user_id}",
    response_model=list[VerificationRunResponse],
)
async def get_verification_runs(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_internal_token),
):
    """GET /internal/verification/runs/{user_id} — full run history."""
    stmt = (
        select(VerificationRun)
        .where(VerificationRun.user_id == user_id)
        .order_by(desc(VerificationRun.started_at))
    )
    result = await db.execute(stmt)
    runs = result.scalars().all()

    return [
        VerificationRunResponse(
            id=str(r.id),
            status=r.status.value,
            trigger=r.trigger,
            sources_attempted=r.sources_attempted,
            sources_succeeded=r.sources_succeeded,
            raw_scores=r.raw_scores,
            final_score=float(r.final_score) if r.final_score else None,
            detected_primary_skill=r.detected_primary_skill,
            normalised_primary_skill=r.normalised_primary_skill,
            assigned_level=r.assigned_level,
            error_detail=r.error_detail,
            started_at=r.started_at.isoformat(),
            completed_at=r.completed_at.isoformat() if r.completed_at else None,
        )
        for r in runs
    ]


# ══════════════════════════════════════════════════════════
# ADMIN ENDPOINTS (ADMIN role)
# ══════════════════════════════════════════════════════════


@router.post(
    "/admin/verification/trigger-batch",
    response_model=MessageResponse,
)
async def admin_trigger_batch(
    body: TriggerBatchRequest,
    user: User = Depends(_require_admin),
):
    """POST /admin/verification/trigger-batch — trigger for multiple users."""
    from app.modules.verification.tasks import verify_user_skill

    for uid in body.user_ids:
        verify_user_skill.delay(uid, trigger="manual")
    return MessageResponse(message=f"Verification triggered for {len(body.user_ids)} users")


@router.get("/admin/benchmarks", response_model=list[BenchmarkResponse])
async def admin_list_benchmarks(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_admin),
):
    """GET /admin/benchmarks — list all skill benchmark records."""
    stmt = select(SkillBenchmark).order_by(desc(SkillBenchmark.created_at))
    result = await db.execute(stmt)
    benchmarks = result.scalars().all()
    return [
        BenchmarkResponse(
            id=str(b.id),
            skill_category=b.skill_category,
            quarter=b.quarter,
            avg_required_level=float(b.avg_required_level),
            min_required_level=b.min_required_level,
            max_required_level=b.max_required_level,
            jd_sample_size=b.jd_sample_size,
            top_secondary_skills=b.top_secondary_skills,
            created_at=b.created_at.isoformat(),
        )
        for b in benchmarks
    ]


@router.post("/admin/benchmarks/refresh", response_model=MessageResponse)
async def admin_refresh_benchmarks(
    user: User = Depends(_require_admin),
):
    """POST /admin/benchmarks/refresh — manually trigger benchmark scrape."""
    from app.modules.benchmarks.tasks import scrape_industry_benchmarks
    scrape_industry_benchmarks.delay()
    return MessageResponse(message="Quarterly benchmark scrape triggered")


# ══════════════════════════════════════════════════════════
# USER ENDPOINTS (JWT + ACTIVE)
# ══════════════════════════════════════════════════════════


@router.put("/users/me/platforms", response_model=MessageResponse)
async def submit_platforms(
    body: SubmitPlatformsRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_active),
):
    """PUT /users/me/platforms — submit/update platform handles."""
    valid_platforms = {"github", "leetcode", "kaggle", "codeforces", "stackoverflow", "portfolio"}

    for item in body.handles:
        if item.platform not in valid_platforms:
            raise HTTPException(
                status_code=400,
                detail=f"INVALID_PLATFORM_HANDLE: unknown platform '{item.platform}'",
            )

        # Upsert
        stmt = select(UserPlatformHandle).where(
            UserPlatformHandle.user_id == user.id,
            UserPlatformHandle.platform == item.platform,
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            existing.handle = item.handle
            existing.verified = False  # Re-verification needed
        else:
            db.add(UserPlatformHandle(
                user_id=user.id,
                platform=item.platform,
                handle=item.handle,
                verified=False,
            ))

    await db.commit()
    return MessageResponse(message=f"Updated {len(body.handles)} platform handles")


@router.get(
    "/users/me/verification-status",
    response_model=VerificationStatusResponse,
)
async def my_verification_status(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_active),
):
    """GET /users/me/verification-status — current verification run status."""
    stmt = (
        select(VerificationRun)
        .where(VerificationRun.user_id == user.id)
        .order_by(desc(VerificationRun.started_at))
        .limit(1)
    )
    result = await db.execute(stmt)
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="NO_VERIFICATION_RUN")

    return VerificationStatusResponse(
        status=run.status.value,
        trigger=run.trigger,
        final_score=float(run.final_score) if run.final_score else None,
        assigned_level=run.assigned_level,
        normalised_primary_skill=run.normalised_primary_skill,
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
    )
