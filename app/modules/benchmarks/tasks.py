"""
StackPair – Celery tasks for benchmarks module.

Uses the single shared Celery instance from app.core.celery_app (Fix 2).
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.core.celery_app import celery_app
from app.core.database import async_session_factory
from app.modules.benchmarks.scraper import (
    extract_benchmark_from_jds,
    scrape_jds_for_category,
)
from app.modules.benchmarks.service import create_benchmark
from app.modules.verification.skill_labels import ALLOWED_SKILL_LABELS

logger = logging.getLogger(__name__)


def _run_async(coro):  # noqa: ANN001
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _current_quarter() -> str:
    now = datetime.now(timezone.utc)
    q = (now.month - 1) // 3 + 1
    return f"{now.year}-Q{q}"


@celery_app.task(
    name="app.modules.benchmarks.tasks.scrape_industry_benchmarks",
    bind=True,
    max_retries=2,
    default_retry_delay=120,
)
def scrape_industry_benchmarks(self) -> dict:  # type: ignore[type-arg]
    """Quarterly benchmark scrape for all skill categories."""
    try:
        result = _run_async(_scrape_all_categories())
        return result
    except Exception as exc:
        logger.error("Benchmark scrape failed (attempt %d): %s",
                      self.request.retries + 1, exc)
        raise self.retry(exc=exc)


async def _scrape_all_categories() -> dict:  # type: ignore[type-arg]
    quarter = _current_quarter()
    processed = 0

    async with async_session_factory() as db:
        for category in ALLOWED_SKILL_LABELS:
            try:
                jds = await scrape_jds_for_category(category)
                benchmark_data = await extract_benchmark_from_jds(category, jds)

                await create_benchmark(
                    db=db,
                    skill_category=category,
                    quarter=quarter,
                    avg_required_level=benchmark_data.get("avg_required_level", 0),
                    min_required_level=int(benchmark_data.get("min_required_level", 0)),
                    max_required_level=int(benchmark_data.get("max_required_level", 0)),
                    jd_sample_size=benchmark_data.get("jd_sample_size", 0),
                    top_secondary_skills=benchmark_data.get("top_secondary_skills"),
                )
                processed += 1
            except Exception as exc:
                logger.error("Failed to process benchmarks for '%s': %s", category, exc)
                continue

        await db.commit()

    logger.info("Quarterly benchmarks: processed %d / %d categories for %s",
                processed, len(ALLOWED_SKILL_LABELS), quarter)
    return {"quarter": quarter, "processed": processed, "total": len(ALLOWED_SKILL_LABELS)}
