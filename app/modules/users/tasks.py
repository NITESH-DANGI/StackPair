"""
StackPair – M-01 user tasks (stub for Celery beat schedule).

Uses the single shared Celery instance from app.core.celery_app (Fix 2).
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.core.celery_app import celery_app
from app.core.database import async_session_factory

logger = logging.getLogger(__name__)


def _run_async(coro):  # noqa: ANN001
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    name="app.modules.users.tasks.hard_delete_expired_users",
    bind=True,
)
def hard_delete_expired_users(self) -> dict:  # type: ignore[type-arg]
    """
    Daily cleanup: permanently delete users who were soft-deleted 30+ days ago.
    """
    result = _run_async(_hard_delete_async())
    return result


async def _hard_delete_async() -> dict:  # type: ignore[type-arg]
    from sqlalchemy import delete
    from app.modules.users.models import User

    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    async with async_session_factory() as db:
        stmt = delete(User).where(
            User.is_active.is_(False),
            User.updated_at < cutoff,
        )
        result = await db.execute(stmt)
        await db.commit()
        count = result.rowcount

    logger.info("Hard-deleted %d expired users", count)
    return {"deleted": count}
