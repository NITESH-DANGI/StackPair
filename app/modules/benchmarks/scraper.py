"""
StackPair – Industry benchmark JD scraper (§8.9).

Scrapes public job boards per skill category, extracts required
levels/skills via Claude API, and stores in skill_benchmarks table.
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

_JD_EXTRACTION_PROMPT = """You are a job market analyst AI. Given {count} job description excerpts
for the role category "{skill_category}", extract:
1. avg_required_level: Average required proficiency level (0-5 scale)
2. min_required_level: Minimum level seen across JDs
3. max_required_level: Maximum level seen across JDs
4. top_secondary_skills: List of most commonly mentioned secondary skills (max 5)

Return ONLY valid JSON with these exact keys.
Example: {{"avg_required_level": 3.2, "min_required_level": 2, "max_required_level": 5, "top_secondary_skills": ["Docker", "AWS", "SQL"]}}

Job descriptions:
{jd_texts}
"""


async def scrape_jds_for_category(skill_category: str) -> list[str]:
    """
    Fetch job description excerpts from public sources.
    Returns a list of JD text snippets (max 20).
    """
    jds: list[str] = []

    # Search via a public job search proxy (simplified; real impl would
    # hit LinkedIn Jobs public API, Indeed, Naukri, etc.)
    search_query = skill_category.replace("/", " ").replace("(", "").replace(")", "")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Placeholder: in production, integrate with real job APIs
            resp = await client.get(
                "https://www.googleapis.com/customsearch/v1",
                params={
                    "q": f"{search_query} developer job description",
                    "num": 10,
                    "cx": "placeholder",
                    "key": "placeholder",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("items", [])[:20]:
                    snippet = item.get("snippet", "")
                    if snippet:
                        jds.append(snippet)
    except Exception as exc:
        logger.warning("JD scraping failed for '%s': %s", skill_category, exc)

    return jds


async def extract_benchmark_from_jds(
    skill_category: str,
    jd_texts: list[str],
) -> dict[str, Any]:
    """Send JDs to Claude API in batches of 20 and extract benchmark data."""
    if not jd_texts:
        return {
            "avg_required_level": 0,
            "min_required_level": 0,
            "max_required_level": 0,
            "top_secondary_skills": [],
            "jd_sample_size": 0,
        }

    combined_text = "\n---\n".join(jd_texts[:20])
    prompt = _JD_EXTRACTION_PROMPT.format(
        count=len(jd_texts[:20]),
        skill_category=skill_category,
        jd_texts=combined_text[:4000],
    )

    if not settings.claude_api_key:
        logger.warning("CLAUDE_API_KEY not set — returning default benchmarks")
        return {
            "avg_required_level": 3.0,
            "min_required_level": 1,
            "max_required_level": 5,
            "top_secondary_skills": [],
            "jd_sample_size": len(jd_texts),
        }

    try:
        headers = {
            "x-api-key": settings.claude_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        body = {
            "model": _MODEL,
            "max_tokens": 200,
            "messages": [{"role": "user", "content": prompt}],
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(_CLAUDE_URL, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()

        content = data["content"][0]["text"].strip()
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1])
        result = json.loads(content)
        result["jd_sample_size"] = len(jd_texts)
        return result

    except Exception as exc:
        logger.error("Claude JD extraction failed for '%s': %s", skill_category, exc)
        return {
            "avg_required_level": 3.0,
            "min_required_level": 1,
            "max_required_level": 5,
            "top_secondary_skills": [],
            "jd_sample_size": len(jd_texts),
        }
