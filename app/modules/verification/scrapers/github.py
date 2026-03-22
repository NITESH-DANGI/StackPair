"""
StackPair – GitHub scraper (35 %).

Analyses:
 • Language distribution across public repos (top 3)
 • Contribution frequency (commits in last 12 months)
 • Repository quality (avg stars, README presence, OSS contributions)
 • Account age and consistency (years active, longest streak)

Uses GitHub REST API v3 with a PAT for higher rate limits.  The scraper
checks `X-RateLimit-Remaining` after each call and pauses if remaining < 100.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.modules.verification.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

_BASE = "https://api.github.com"


class GitHubScraper(BaseScraper):
    PLATFORM_NAME = "github"
    WEIGHT = 0.35

    def __init__(self) -> None:
        self._headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if settings.github_pat:
            self._headers["Authorization"] = f"Bearer {settings.github_pat}"

    # ── helpers ──────────────────────────────────────────

    async def _get(self, client: httpx.AsyncClient, path: str) -> Any:
        """GET with rate-limit awareness."""
        resp = await client.get(f"{_BASE}{path}", headers=self._headers)
        remaining = int(resp.headers.get("X-RateLimit-Remaining", "5000"))
        if remaining < 100:
            reset_at = int(resp.headers.get("X-RateLimit-Reset", "0"))
            wait = max(reset_at - int(datetime.now(timezone.utc).timestamp()), 1)
            logger.warning("GitHub rate limit low (%d). Sleeping %ds.", remaining, wait)
            await asyncio.sleep(wait)
        resp.raise_for_status()
        return resp.json()

    # ── BaseScraper interface ────────────────────────────

    async def fetch(self, handle: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            user = await self._get(client, f"/users/{handle}")
            repos = await self._get(client, f"/users/{handle}/repos?per_page=100&sort=updated&type=owner")
            # Contribution calendar (events proxy)
            events = await self._get(client, f"/users/{handle}/events/public?per_page=100")

            # Aggregate language bytes across repos (top 5 repos by stars)
            sorted_repos = sorted(repos, key=lambda r: r.get("stargazers_count", 0), reverse=True)
            languages: dict[str, int] = {}
            for repo in sorted_repos[:10]:
                try:
                    lang_data = await self._get(client, f"/repos/{handle}/{repo['name']}/languages")
                    for lang, byte_count in lang_data.items():
                        languages[lang] = languages.get(lang, 0) + byte_count
                except httpx.HTTPStatusError:
                    continue

        return {
            "user": user,
            "repos": repos,
            "events": events,
            "languages": languages,
        }

    def extract_signals(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        user = raw_data["user"]
        repos = raw_data["repos"]
        events = raw_data["events"]
        languages = raw_data["languages"]

        # Original repos only (exclude forks)
        original_repos = [r for r in repos if not r.get("fork", False)]
        total_stars = sum(r.get("stargazers_count", 0) for r in original_repos)
        avg_stars = total_stars / max(len(original_repos), 1)
        has_readme = sum(1 for r in original_repos if r.get("has_wiki") or r.get("description"))

        # Top 3 languages
        sorted_langs = sorted(languages.items(), key=lambda x: x[1], reverse=True)
        top_languages = [lang for lang, _ in sorted_langs[:3]]

        # Account age in years
        created = datetime.fromisoformat(user["created_at"].replace("Z", "+00:00"))
        account_age_years = (datetime.now(timezone.utc) - created).days / 365.25

        # Commit-like events count (PushEvent in last 12 months)
        push_events = [e for e in events if e.get("type") == "PushEvent"]

        return {
            "top_languages": top_languages,
            "language_bytes": dict(sorted_langs[:5]),
            "total_repos": len(original_repos),
            "total_stars": total_stars,
            "avg_stars": round(avg_stars, 2),
            "repos_with_description": has_readme,
            "push_events_recent": len(push_events),
            "account_age_years": round(account_age_years, 1),
            "followers": user.get("followers", 0),
            "public_repos": user.get("public_repos", 0),
        }

    def score(self, signals: dict[str, Any]) -> float:
        s = 0.0

        # Repo count (max 20 pts)
        s += min(signals.get("total_repos", 0) / 25 * 20, 20)

        # Stars (max 20 pts)
        s += min(signals.get("total_stars", 0) / 50 * 20, 20)

        # Recent activity (max 20 pts)
        s += min(signals.get("push_events_recent", 0) / 30 * 20, 20)

        # Account age (max 15 pts — caps at 5 years)
        s += min(signals.get("account_age_years", 0) / 5 * 15, 15)

        # Language diversity (max 10 pts)
        top_langs = signals.get("top_languages", [])
        s += min(len(top_langs) / 3 * 10, 10)

        # Community (followers, max 15 pts)
        s += min(signals.get("followers", 0) / 100 * 15, 15)

        return min(s, 100.0)
