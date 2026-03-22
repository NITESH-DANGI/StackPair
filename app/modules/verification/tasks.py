"""
StackPair – Celery tasks for M-02 verification.

Uses the single shared Celery instance from app.core.celery_app (Fix 2).

Tasks:
  • verify_user_skill   — verify one user
  • verify_user_batch   — weekly batch: fan out individual tasks
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, and_

from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from app.modules.users.models import User, UserProfile
from app.modules.verification.models import VerificationRun, VerifyStatus

logger = logging.getLogger(__name__)

DLQ_KEY = "stackpair:dlq:verification"


def _run_async(coro):  # noqa: ANN001
    """Helper to run async code inside a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    name="app.modules.verification.tasks.verify_user_skill",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
)
def verify_user_skill(self, user_id: str, trigger: str = "manual") -> dict:  # type: ignore[type-arg]
    """
    Verify a single user. Retries up to 3 times with exponential backoff.
    On final failure, pushes to DLQ.
    """
    try:
        result = _run_async(_verify_user_async(user_id, trigger))
        return result
    except Exception as exc:
        logger.error("verify_user_skill failed for %s (attempt %d): %s",
                      user_id, self.request.retries + 1, exc)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        # Final failure — push to DLQ
        _run_async(_push_to_dlq(user_id, str(exc)))
        return {"status": "FAILED", "user_id": user_id, "error": str(exc)}


async def _verify_user_async(user_id: str, trigger: str) -> dict:  # type: ignore[type-arg]
    from app.modules.verification.service import run_verification

    async with async_session_factory() as db:
        # Check for already-running verification
        running_stmt = select(VerificationRun).where(
            and_(
                VerificationRun.user_id == uuid.UUID(user_id),
                VerificationRun.status == VerifyStatus.RUNNING,
            )
        )
        result = await db.execute(running_stmt)
        if result.scalar_one_or_none():
            return {"status": "SKIPPED", "reason": "VERIFICATION_ALREADY_RUNNING"}

        run = await run_verification(db, uuid.UUID(user_id), trigger=trigger)
        return {
            "status": run.status.value,
            "user_id": user_id,
            "level": run.assigned_level,
            "skill": run.normalised_primary_skill,
        }


async def _push_to_dlq(user_id: str, error: str) -> None:
    """Push failed task to Redis Dead Letter Queue."""
    import json
    import redis.asyncio as aioredis
    from app.core.config import settings

    r = aioredis.from_url(settings.upstash_redis_url)
    await r.rpush(DLQ_KEY, json.dumps({
        "user_id": user_id,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }))
    await r.aclose()
    logger.error("User %s pushed to DLQ after all retries", user_id)


@celery_app.task(
    name="app.modules.verification.tasks.verify_user_batch",
    bind=True,
)
def verify_user_batch(self) -> dict:  # type: ignore[type-arg]
    """
    Weekly batch job: fetch eligible users and fan out individual tasks.
    Eligible: is_active=True, last_verified_at older than 7 days (or NULL).
    Batched in groups of VERIFICATION_BATCH_SIZE.
    """
    result = _run_async(_batch_async())
    return result


async def _batch_async() -> dict:  # type: ignore[type-arg]
    from app.core.config import settings

    async with async_session_factory() as db:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)

        # Find eligible users
        stmt = (
            select(User.id)
            .join(UserProfile, UserProfile.user_id == User.id, isouter=True)
            .where(
                and_(
                    User.is_active.is_(True),
                    User.onboarding_state == "ACTIVE",
                    # last_verified_at is NULL or older than 7 days
                    (UserProfile.last_verified_at.is_(None)) | (UserProfile.last_verified_at < cutoff),
                )
            )
        )
        result = await db.execute(stmt)
        user_ids = [str(uid) for (uid,) in result.all()]

    batch_size = settings.verification_batch_size
    enqueued = 0
    for i in range(0, len(user_ids), batch_size):
        batch = user_ids[i : i + batch_size]
        for uid in batch:
            verify_user_skill.delay(uid, trigger="scheduled")
            enqueued += 1

    logger.info("Batch verification enqueued %d users", enqueued)
    return {"enqueued": enqueued, "total_eligible": len(user_ids)}
