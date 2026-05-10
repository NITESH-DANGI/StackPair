"""
StackPair – Claude API skill label normaliser (§8.7).

Takes raw skill signals from all scrapers and sends a single
normalisation call to Claude API, which returns one clean primary
skill label from the predefined ALLOWED_SKILL_LABELS list.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.modules.verification.skill_labels import ALLOWED_SKILL_LABELS

logger = logging.getLogger(__name__)

_CLAUDE_URL = "https://api.anthropic.com/v1/messages"
_MODEL = "claude-sonnet-4-6"

_NORMALISE_PROMPT = """You are a developer skill classification engine.

Given the following skill signals collected from a developer's public profiles,
determine their single PRIMARY skill category.

You MUST return EXACTLY ONE label from this predefined list — do NOT invent new labels:
{labels}

Skill signals:
- Top GitHub languages: {github_languages}
- Top LeetCode problem tags: {leetcode_tags}
- Kaggle notebook topics: {kaggle_topics}
- Codeforces rank: {cf_rank}
- Stack Overflow top tags: {so_tags}
- Portfolio domain: {portfolio_domain}

Return ONLY the label string. No quotes, no explanation, no JSON. Just the label.
Example: Python Backend
"""


async def normalise_skill(
    signals: dict[str, dict[str, Any]],
) -> str:
    """
    Call Claude API to normalise raw signals into one clean skill label.
    Falls back to the top GitHub language if Claude is unavailable.
    """
    github_signals = signals.get("github", {})
    leetcode_signals = signals.get("leetcode", {})
    kaggle_signals = signals.get("kaggle", {})
    codeforces_signals = signals.get("codeforces", {})
    stackoverflow_signals = signals.get("stackoverflow", {})
    portfolio_signals = signals.get("portfolio", {})

    prompt = _NORMALISE_PROMPT.format(
        labels=", ".join(ALLOWED_SKILL_LABELS),
        github_languages=", ".join(github_signals.get("top_languages", [])),
        leetcode_tags=", ".join(leetcode_signals.get("top_tags", [])),
        kaggle_topics=", ".join(kaggle_signals.get("kernel_topics", [])),
        cf_rank=codeforces_signals.get("max_rank", "unrated"),
        so_tags=", ".join(stackoverflow_signals.get("top_tags", [])),
        portfolio_domain=portfolio_signals.get("primary_domain", ""),
    )

    if not settings.claude_api_key:
        logger.warning("CLAUDE_API_KEY not set — falling back to heuristic normalisation")
        return _heuristic_fallback(github_signals)

    try:
        headers = {
            "x-api-key": settings.claude_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        body = {
            "model": _MODEL,
            "max_tokens": 50,
            "messages": [{"role": "user", "content": prompt}],
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(_CLAUDE_URL, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()

        label = data["content"][0]["text"].strip()

        # Validate against allowed list
        if label in ALLOWED_SKILL_LABELS:
            return label

        # Try fuzzy match (case-insensitive)
        label_lower = label.lower()
        for allowed in ALLOWED_SKILL_LABELS:
            if allowed.lower() == label_lower:
                return allowed

        logger.warning("Claude returned unlisted label '%s' — using fallback", label)
        return _heuristic_fallback(github_signals)

    except Exception as exc:
        logger.error("Claude normalisation failed: %s — using fallback", exc)
        return _heuristic_fallback(github_signals)


def _heuristic_fallback(github_signals: dict[str, Any]) -> str:
    """Simple fallback when Claude is unavailable."""
    top_langs = github_signals.get("top_languages", [])
    if not top_langs:
        return ALLOWED_SKILL_LABELS[0]  # Default

    lang = top_langs[0].lower()
    mapping: dict[str, str] = {
        "python": "Python Backend",
        "javascript": "Frontend (React)",
        "typescript": "Frontend (React)",
        "java": "Java Backend",
        "go": "Go Backend",
        "rust": "Rust",
        "kotlin": "Android Development",
        "swift": "iOS Development",
        "c++": "Competitive Programming",
        "c": "Embedded Systems",
        "jupyter notebook": "Data Science",
        "r": "Data Science",
    }
    return mapping.get(lang, "Full Stack")
