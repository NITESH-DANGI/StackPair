"""
StackPair – Weighted scorer + level mapping (§3).

• Aggregates weighted scores from all scrapers
• Re-weights proportionally when sources are missing
• Maps 0-100 score → level 0-5
• Anti-gaming: burst detection, cross-source consistency
"""

from __future__ import annotations

import logging
from typing import Any

from app.modules.verification.scrapers.base import ScraperResult

logger = logging.getLogger(__name__)

# ── Level thresholds (§3.2) ────────────────────────────
LEVEL_THRESHOLDS: list[tuple[int, int]] = [
    (0, 9),     # Level 0
    (10, 29),   # Level 1
    (30, 49),   # Level 2
    (50, 69),   # Level 3
    (70, 84),   # Level 4
    (85, 100),  # Level 5
]


def score_to_level(score: float) -> int:
    """Map a 0-100 score to level 0-5."""
    score = max(0.0, min(100.0, score))
    for level, (lo, hi) in enumerate(LEVEL_THRESHOLDS):
        if lo <= score <= hi:
            return level
    return 5  # 85-100


def compute_weighted_score(results: list[ScraperResult]) -> float:
    """
    Compute the weighted aggregate score from scraper results.
    Only successful results are included; weights are re-normalised
    proportionally across the sources that returned data (§REQ-M02-04).
    """
    successful = [r for r in results if r.success]
    if not successful:
        return 0.0

    # Scraper name → weight mapping
    weight_map: dict[str, float] = {
        "github": 0.35,
        "leetcode": 0.25,
        "kaggle": 0.15,
        "codeforces": 0.10,
        "stackoverflow": 0.10,
        "portfolio": 0.05,
    }

    total_weight = sum(weight_map.get(r.platform, 0.0) for r in successful)
    if total_weight == 0:
        return 0.0

    weighted_sum = sum(
        r.score * weight_map.get(r.platform, 0.0) for r in successful
    )

    # Re-weight proportionally
    return weighted_sum / total_weight


# ── Anti-gaming checks (§9) ────────────────────────────


def detect_burst_activity(signals: dict[str, Any], platform: str) -> bool:
    """
    Detect burst activity (§9.2).
    Returns True if suspicious spike is detected.
    A spike > 5x the 90-day baseline triggers the flag.
    """
    if platform == "leetcode":
        recent = signals.get("recent_7d_solved", 0)
        baseline_90d = signals.get("baseline_90d_avg_weekly", 1)
        if baseline_90d > 0 and recent > 5 * baseline_90d:
            logger.warning("Burst activity detected on %s: %d vs baseline %d",
                           platform, recent, baseline_90d)
            return True
    return False


def check_cross_source_consistency(
    results: list[ScraperResult],
) -> tuple[bool, float]:
    """
    Check cross-source consistency (§9.3).
    Returns (is_consistent, confidence_multiplier).
    If the primary skill detected by GitHub contradicts all other sources,
    confidence is reduced.
    """
    github_result = next((r for r in results if r.platform == "github" and r.success), None)
    if not github_result:
        return True, 1.0

    gh_langs = set(github_result.signals.get("top_languages", []))
    if not gh_langs:
        return True, 1.0

    # Check if other sources' signals are consistent
    contradictions = 0
    checks = 0
    for r in results:
        if r.platform == "github" or not r.success:
            continue
        checks += 1
        tags = set(r.signals.get("top_tags", []) + r.signals.get("kernel_topics", []))
        if tags and not tags & gh_langs:
            contradictions += 1

    if checks > 0 and contradictions == checks:
        logger.warning("Cross-source inconsistency: GitHub languages %s conflict with all other sources", gh_langs)
        return False, 0.7  # 30% confidence penalty

    return True, 1.0


def run_scoring_pipeline(results: list[ScraperResult]) -> dict[str, Any]:
    """
    Full scoring pipeline: weighted score → anti-gaming → level mapping.
    Returns dict with final_score, assigned_level, is_consistent, etc.
    """
    raw_score = compute_weighted_score(results)

    # Anti-gaming: cross-source consistency
    is_consistent, confidence_multiplier = check_cross_source_consistency(results)
    adjusted_score = raw_score * confidence_multiplier

    level = score_to_level(adjusted_score)

    return {
        "raw_score": round(raw_score, 2),
        "final_score": round(adjusted_score, 2),
        "assigned_level": level,
        "is_consistent": is_consistent,
        "confidence_multiplier": confidence_multiplier,
        "sources_attempted": [r.platform for r in results],
        "sources_succeeded": [r.platform for r in results if r.success],
        "raw_scores": {r.platform: round(r.score, 2) for r in results if r.success},
    }
