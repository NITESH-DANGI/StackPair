"""
StackPair – Stack Overflow scraper (10 %).

Analyses reputation, top tags, and answer acceptance rate.
Uses the Stack Exchange API v2.3.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.modules.verification.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

_BASE = "https://api.stackexchange.com/2.3"


class StackOverflowScraper(BaseScraper):
    PLATFORM_NAME = "stackoverflow"
    WEIGHT = 0.10

    async def fetch(self, handle: str) -> dict[str, Any]:
        params: dict[str, str] = {
            "site": "stackoverflow",
            "filter": "!nNPvSNdWme",
        }
        if settings.stackoverflow_key:
            params["key"] = settings.stackoverflow_key

        async with httpx.AsyncClient(timeout=30) as client:
            # User info (handle is a numeric user ID)
            user_resp = await client.get(
                f"{_BASE}/users/{handle}",
                params=params,
            )
            user_resp.raise_for_status()
            user_data = user_resp.json()
            if not user_data.get("items"):
                raise ValueError(f"Stack Overflow user '{handle}' not found")

            # Top tags
            tags_resp = await client.get(
                f"{_BASE}/users/{handle}/top-answer-tags",
                params={**params, "pagesize": "10"},
            )
            tags_resp.raise_for_status()
            tags_data = tags_resp.json()

        return {
            "user": user_data["items"][0],
            "top_tags": tags_data.get("items", []),
        }

    def extract_signals(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        user = raw_data["user"]
        tags = raw_data["top_tags"]

        reputation = user.get("reputation", 0)
        answer_count = user.get("answer_count", 0)
        accept_rate = user.get("accept_rate", 0)

        top_tag_names = [t.get("tag_name", "") for t in tags[:5]]

        return {
            "reputation": reputation,
            "answer_count": answer_count,
            "accept_rate": accept_rate,
            "top_tags": top_tag_names,
            "gold_badges": user.get("badge_counts", {}).get("gold", 0),
            "silver_badges": user.get("badge_counts", {}).get("silver", 0),
        }

    def score(self, signals: dict[str, Any]) -> float:
        s = 0.0

        # Reputation (max 40 pts)
        rep = signals.get("reputation", 0)
        if rep >= 100000:
            s += 40
        elif rep >= 25000:
            s += 30
        elif rep >= 5000:
            s += 20
        elif rep >= 1000:
            s += 10
        elif rep > 0:
            s += 5

        # Answer volume (max 25 pts)
        s += min(signals.get("answer_count", 0) / 200 * 25, 25)

        # Accept rate (max 15 pts)
        s += min(signals.get("accept_rate", 0) / 100 * 15, 15)

        # Badges (max 20 pts)
        gold = signals.get("gold_badges", 0)
        silver = signals.get("silver_badges", 0)
        s += min((gold * 5 + silver * 1) / 25 * 20, 20)

        return min(s, 100.0)
