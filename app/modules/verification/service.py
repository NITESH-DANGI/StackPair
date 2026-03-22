"""
StackPair – Verification orchestrator service (§8).

Coordinates the full verification pipeline for a single user:
 1. Auto-populate platform handles from user profile (Fix 3)
 2. Run all scrapers in parallel
 3. Score + normalise
 4. Write results to M-01 via internal endpoint
 5. Upsert skill vector to Pinecone (Fix 4)
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.users.models import User, UserProfile
from app.modules.verification.models import (
    UserPlatformHandle,
    VerificationRun,
    VerifyStatus,
)
from app.modules.verification.normaliser import normalise_skill
from app.modules.verification.scorer import run_scoring_pipeline
from app.modules.verification.scrapers.base import ScraperResult
from app.modules.verification.scrapers.codeforces import CodeforcesScraper
from app.modules.verification.scrapers.github import GitHubScraper
from app.modules.verification.scrapers.kaggle import KaggleScraper
from app.modules.verification.scrapers.leetcode import LeetCodeScraper
from app.modules.verification.scrapers.portfolio import PortfolioScraper
from app.modules.verification.scrapers.stackoverflow import StackOverflowScraper

logger = logging.getLogger(__name__)

# scraper registry
_SCRAPERS: dict[str, type] = {
    "github": GitHubScraper,
    "leetcode": LeetCodeScraper,
    "kaggle": KaggleScraper,
    "codeforces": CodeforcesScraper,
    "stackoverflow": StackOverflowScraper,
    "portfolio": PortfolioScraper,
}


# ── Fix 3: Auto-populate platform handles from profile ─


async def auto_populate_handles(db: AsyncSession, user_id: uuid.UUID) -> None:
    """
    Before running scrapers, check user_profiles for github_handle and
    portfolio_url.  If present and no matching row in user_platform_handles
    exists, insert one automatically.
    """
    profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
    result = await db.execute(profile_stmt)
    profile = result.scalar_one_or_none()
    if not profile:
        return

    mapping: list[tuple[str, str | None]] = [
        ("github", getattr(profile, "github_handle", None)),
        ("portfolio", getattr(profile, "portfolio_url", None)),
    ]

    for platform, handle_value in mapping:
        if not handle_value:
            continue
        # Check if row already exists
        exists_stmt = select(UserPlatformHandle).where(
            and_(
                UserPlatformHandle.user_id == user_id,
                UserPlatformHandle.platform == platform,
            )
        )
        exists_result = await db.execute(exists_stmt)
        if exists_result.scalar_one_or_none():
            continue  # Already present

        new_handle = UserPlatformHandle(
            user_id=user_id,
            platform=platform,
            handle=handle_value,
            verified=False,  # Not checked yet
        )
        db.add(new_handle)

    await db.flush()


# ── Fix 4: Pinecone upsert ────────────────────────────


async def upsert_to_pinecone(
    user_id: uuid.UUID,
    primary_skill: str,
    level: int,
    signals: dict[str, Any],
) -> None:
    """
    Upsert the user's skill vector to Pinecone. Non-blocking: failures
    are logged but do NOT cause the overall verification to fail.
    """
    if not settings.pinecone_api_key:
        logger.info("PINECONE_API_KEY not set — skipping Pinecone upsert")
        return

    try:
        # Build a simple dense vector from signals for M-03 readiness
        vector = _build_skill_vector(primary_skill, level, signals)
        pinecone_url = (
            f"https://{settings.pinecone_index}-"
            f"{settings.pinecone_api_key[:8]}.svc.pinecone.io"
        )
        headers = {"Api-Key": settings.pinecone_api_key, "Content-Type": "application/json"}
        body = {
            "vectors": [
                {
                    "id": str(user_id),
                    "values": vector,
                    "metadata": {
                        "primary_skill": primary_skill,
                        "level": level,
                    },
                }
            ]
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{pinecone_url}/vectors/upsert",
                headers=headers,
                json=body,
            )
            resp.raise_for_status()
        logger.info("Pinecone upsert succeeded for user %s", user_id)
    except Exception as exc:
        logger.error("Pinecone upsert failed for user %s: %s (non-fatal)", user_id, exc)


def _build_skill_vector(
    primary_skill: str, level: int, signals: dict[str, Any]
) -> list[float]:
    """Build a 64-dim dense vector for Pinecone from skill signals."""
    from app.modules.verification.skill_labels import ALLOWED_SKILL_LABELS

    # One-hot encode primary skill (20 dims)
    skill_vec = [0.0] * len(ALLOWED_SKILL_LABELS)
    try:
        idx = ALLOWED_SKILL_LABELS.index(primary_skill)
        skill_vec[idx] = 1.0
    except ValueError:
        pass

    # Level normalised (1 dim)
    level_norm = [level / 5.0]

    # Pad to 64 dims total
    padding_size = 64 - len(skill_vec) - len(level_norm)
    padding = [0.0] * max(padding_size, 0)

    return (skill_vec + level_norm + padding)[:64]


# ── Main orchestrator ──────────────────────────────────


async def run_verification(
    db: AsyncSession,
    user_id: uuid.UUID,
    trigger: str = "manual",
) -> VerificationRun:
    """
    Full verification pipeline for one user.
    """
    # Create verification run record
    run = VerificationRun(
        user_id=user_id,
        status=VerifyStatus.RUNNING,
        trigger=trigger,
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    await db.flush()

    try:
        # Fix 3: Auto-populate handles from profile
        await auto_populate_handles(db, user_id)

        # Fetch all platform handles for this user
        handles_stmt = select(UserPlatformHandle).where(
            UserPlatformHandle.user_id == user_id
        )
        handles_result = await db.execute(handles_stmt)
        handles = {h.platform: h.handle for h in handles_result.scalars().all()}

        if not handles:
            run.status = VerifyStatus.SKIPPED
            run.error_detail = "No platform handles configured for this user"
            run.completed_at = datetime.now(timezone.utc)
            await db.commit()
            return run

        # Run scrapers in parallel
        tasks: list = []
        attempted_platforms: list[str] = []
        for platform, handle in handles.items():
            scraper_cls = _SCRAPERS.get(platform)
            if scraper_cls:
                attempted_platforms.append(platform)
                scraper = scraper_cls()
                tasks.append(scraper.run(handle))

        results: list[ScraperResult] = await asyncio.gather(*tasks)
        run.sources_attempted = attempted_platforms
        run.sources_succeeded = [r.platform for r in results if r.success]

        # Check if all failed
        if not any(r.success for r in results):
            run.status = VerifyStatus.FAILED
            run.error_detail = "ALL_SOURCES_FAILED"
            run.completed_at = datetime.now(timezone.utc)
            await db.commit()
            return run

        # Score
        scoring = run_scoring_pipeline(results)
        run.raw_scores = scoring["raw_scores"]
        run.final_score = scoring["final_score"]
        run.assigned_level = scoring["assigned_level"]

        # Detect primary skill (raw)
        github_result = next((r for r in results if r.platform == "github" and r.success), None)
        if github_result:
            top_langs = github_result.signals.get("top_languages", [])
            run.detected_primary_skill = ", ".join(top_langs[:3]) if top_langs else None

        # Normalise via Claude
        all_signals = {r.platform: r.signals for r in results if r.success}
        normalised_label = await normalise_skill(all_signals)
        run.normalised_primary_skill = normalised_label

        # Write to M-01 via internal endpoint
        m01_success = await _call_m01_internal_endpoint(
            user_id=user_id,
            primary_skill=normalised_label,
            skill_level=scoring["assigned_level"],
        )

        if m01_success:
            run.status = VerifyStatus.COMPLETE

            # Fix 4: Upsert to Pinecone (non-blocking)
            await upsert_to_pinecone(
                user_id=user_id,
                primary_skill=normalised_label,
                level=scoring["assigned_level"],
                signals=all_signals,
            )

            # Update last_verified_at on profile
            profile_stmt = select(UserProfile).where(UserProfile.user_id == user_id)
            profile_result = await db.execute(profile_stmt)
            profile = profile_result.scalar_one_or_none()
            if profile:
                profile.last_verified_at = datetime.now(timezone.utc)
                profile.inactivity_warnings = 0  # Reset on successful verification
        else:
            run.status = VerifyStatus.FAILED
            run.error_detail = "M-01 internal endpoint write failed"

        run.completed_at = datetime.now(timezone.utc)
        await db.commit()
        return run

    except Exception as exc:
        logger.exception("Verification failed for user %s", user_id)
        run.status = VerifyStatus.FAILED
        run.error_detail = str(exc)[:500]
        run.completed_at = datetime.now(timezone.utc)
        await db.commit()
        return run


async def _call_m01_internal_endpoint(
    user_id: uuid.UUID,
    primary_skill: str,
    skill_level: int,
) -> bool:
    """PUT /api/v1/internal/users/{user_id}/skill-level using INTERNAL_SERVICE_TOKEN."""
    if not settings.internal_service_token:
        logger.error("INTERNAL_SERVICE_TOKEN not set — cannot write skill level")
        return False

    try:
        url = f"http://127.0.0.1:8000/api/v1/internal/users/{user_id}/skill-level"
        headers = {
            "Authorization": f"Bearer {settings.internal_service_token}",
            "Content-Type": "application/json",
        }
        body = {"primary_skill": primary_skill, "skill_level": skill_level}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.put(url, headers=headers, json=body)
            resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("M-01 internal endpoint call failed: %s", exc)
        return False
