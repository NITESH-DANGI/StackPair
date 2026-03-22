"""
StackPair – Benchmark CRUD service.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.verification.models import SkillBenchmark


async def create_benchmark(
    db: AsyncSession,
    skill_category: str,
    quarter: str,
    avg_required_level: float,
    min_required_level: int,
    max_required_level: int,
    jd_sample_size: int,
    top_secondary_skills: list[str] | None = None,
) -> SkillBenchmark:
    """Create or update a skill benchmark record for a given quarter."""
    # Check if exists for this category + quarter
    stmt = select(SkillBenchmark).where(
        SkillBenchmark.skill_category == skill_category,
        SkillBenchmark.quarter == quarter,
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        existing.avg_required_level = avg_required_level
        existing.min_required_level = min_required_level
        existing.max_required_level = max_required_level
        existing.jd_sample_size = jd_sample_size
        existing.top_secondary_skills = top_secondary_skills
        await db.flush()
        return existing

    benchmark = SkillBenchmark(
        skill_category=skill_category,
        quarter=quarter,
        avg_required_level=avg_required_level,
        min_required_level=min_required_level,
        max_required_level=max_required_level,
        jd_sample_size=jd_sample_size,
        top_secondary_skills=top_secondary_skills,
    )
    db.add(benchmark)
    await db.flush()
    return benchmark
