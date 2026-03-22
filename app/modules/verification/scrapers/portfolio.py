"""
StackPair – Portfolio analyser (5 %) — Claude API.

Fetches the portfolio URL via httpx, extracts raw text, and sends it
to Claude (claude-sonnet-4-6) to identify:
 • Primary technical domain
 • Specific technologies and frameworks
 • Estimated proficiency signal

Prompt is kept under 1 000 tokens to minimise cost.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import settings
from app.modules.verification.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

_CLAUDE_URL = "https://api.anthropic.com/v1/messages"
_MODEL = "claude-sonnet-4-6"

_EXTRACTION_PROMPT = """You are a technical recruiter AI. Given the text content of a developer's
portfolio website, identify:
1. primary_domain: The primary technical domain (e.g. "Backend", "Frontend", "ML", "DevOps")
2. technologies: A list of specific technologies and frameworks mentioned (max 10)
3. proficiency_signal: A score from 0 to 100 representing the estimated proficiency
   based on the complexity and quality of work described.

Return ONLY valid JSON with these exact keys. No markdown, no explanation.
Example: {"primary_domain": "Backend", "technologies": ["Python", "FastAPI"], "proficiency_signal": 65}

Portfolio text (truncated to 3000 chars):
"""


class PortfolioScraper(BaseScraper):
    PLATFORM_NAME = "portfolio"
    WEIGHT = 0.05

    async def fetch(self, handle: str) -> dict[str, Any]:
        """handle is a URL for portfolio scraper."""
        url = handle if handle.startswith("http") else f"https://{handle}"
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            # Extract plain text (strip HTML tags naively)
            import re
            text = re.sub(r"<[^>]+>", " ", resp.text)
            text = re.sub(r"\s+", " ", text).strip()
            # Truncate to 3000 chars for cost control
            text = text[:3000]
        return {"url": url, "text": text}

    def _parse_claude_response(self, content: str) -> dict[str, Any]:
        """Parse Claude's JSON response, handling possible markdown wrapping."""
        content = content.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1])
        return json.loads(content)

    async def _call_claude(self, text: str) -> dict[str, Any]:
        """Send text to Claude API and return parsed JSON."""
        headers = {
            "x-api-key": settings.claude_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        body = {
            "model": _MODEL,
            "max_tokens": 300,
            "messages": [
                {"role": "user", "content": f"{_EXTRACTION_PROMPT}\n{text}"}
            ],
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(_CLAUDE_URL, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
        content_text = data["content"][0]["text"]
        return self._parse_claude_response(content_text)

    def extract_signals(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        # This is called after fetch; we store the text for score()
        return raw_data

    async def run(self, handle: str) -> Any:
        """Override run to add Claude call between extract and score."""
        from app.modules.verification.scrapers.base import ScraperResult
        try:
            raw_data = await self.fetch(handle)
            claude_result = await self._call_claude(raw_data["text"])
            signals = {
                "primary_domain": claude_result.get("primary_domain", ""),
                "technologies": claude_result.get("technologies", []),
                "proficiency_signal": claude_result.get("proficiency_signal", 0),
                "url": raw_data["url"],
            }
            computed_score = self.score(signals)
            return ScraperResult(
                platform=self.PLATFORM_NAME,
                score=min(max(computed_score, 0.0), 100.0),
                signals=signals,
                raw_data=raw_data,
                success=True,
            )
        except Exception as exc:
            logger.error("Portfolio scraper failed for '%s': %s", handle, exc)
            return ScraperResult(
                platform=self.PLATFORM_NAME,
                success=False,
                error=str(exc),
            )

    def score(self, signals: dict[str, Any]) -> float:
        # Claude already provides a proficiency signal 0–100
        return min(max(float(signals.get("proficiency_signal", 0)), 0.0), 100.0)
