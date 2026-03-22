"""
StackPair – Codeforces scraper (10 %).

Analyses rating, max rank achieved, and contest history.
Uses the Codeforces public API.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.modules.verification.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

_BASE = "https://codeforces.com/api"

# Codeforces ranks ordered by prestige
_RANK_SCORES: dict[str, float] = {
    "legendary grandmaster": 100,
    "international grandmaster": 90,
    "grandmaster": 80,
    "international master": 70,
    "master": 60,
    "candidate master": 50,
    "expert": 40,
    "specialist": 30,
    "pupil": 20,
    "newbie": 10,
}


class CodeforcesScraper(BaseScraper):
    PLATFORM_NAME = "codeforces"
    WEIGHT = 0.10

    async def fetch(self, handle: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            info_resp = await client.get(f"{_BASE}/user.info", params={"handles": handle})
            info_resp.raise_for_status()
            info_data = info_resp.json()
            if info_data.get("status") != "OK":
                raise ValueError(f"Codeforces user '{handle}' not found")

            rating_resp = await client.get(f"{_BASE}/user.rating", params={"handle": handle})
            rating_resp.raise_for_status()
            rating_data = rating_resp.json()

        return {
            "user": info_data["result"][0],
            "contests": rating_data.get("result", []),
        }

    def extract_signals(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        user = raw_data["user"]
        contests = raw_data.get("contests", [])

        return {
            "current_rating": user.get("rating", 0),
            "max_rating": user.get("maxRating", 0),
            "current_rank": user.get("rank", "unrated"),
            "max_rank": user.get("maxRank", "unrated"),
            "contests_participated": len(contests),
        }

    def score(self, signals: dict[str, Any]) -> float:
        s = 0.0

        # Max rating (max 50 pts)
        max_rating = signals.get("max_rating", 0)
        if max_rating >= 2400:
            s += 50
        elif max_rating >= 1900:
            s += 40
        elif max_rating >= 1600:
            s += 30
        elif max_rating >= 1200:
            s += 20
        elif max_rating > 0:
            s += 10

        # Max rank (max 30 pts)
        max_rank = signals.get("max_rank", "unrated").lower()
        s += _RANK_SCORES.get(max_rank, 0) * 0.3

        # Contest participation (max 20 pts)
        s += min(signals.get("contests_participated", 0) / 50 * 20, 20)

        return min(s, 100.0)
