"""
StackPair – Abstract base scraper for M-02 Verification Engine.

Every platform scraper inherits from BaseScraper and implements:
  • fetch(handle)          → raw platform data
  • extract_signals(data)  → structured signal dict
  • score(signals)         → normalised score 0–100

Class constants:
  • PLATFORM_NAME  – e.g. "github", "leetcode"
  • WEIGHT         – percentage weight for final score (e.g. 0.35)
"""

from __future__ import annotations

import abc
import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class ScraperResult:
    """Uniform result object returned by every scraper."""

    platform: str
    score: float = 0.0  # 0–100
    signals: dict[str, Any] = field(default_factory=dict)
    raw_data: dict[str, Any] = field(default_factory=dict)
    success: bool = True
    error: str | None = None


class BaseScraper(abc.ABC):
    """Abstract base class for all M-02 platform scrapers."""

    PLATFORM_NAME: str = ""
    WEIGHT: float = 0.0

    @abc.abstractmethod
    async def fetch(self, handle: str) -> dict[str, Any]:
        """Fetch raw data from the platform API for the given handle."""
        ...

    @abc.abstractmethod
    def extract_signals(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Extract structured skill signals from the raw API data."""
        ...

    @abc.abstractmethod
    def score(self, signals: dict[str, Any]) -> float:
        """Compute a normalised score (0–100) from the extracted signals."""
        ...

    async def run(self, handle: str) -> ScraperResult:
        """
        Full pipeline: fetch → extract_signals → score.
        Catches all exceptions and returns a failed ScraperResult instead
        of propagating, so partial scoring can proceed.
        """
        try:
            raw_data = await self.fetch(handle)
            signals = self.extract_signals(raw_data)
            computed_score = self.score(signals)
            return ScraperResult(
                platform=self.PLATFORM_NAME,
                score=min(max(computed_score, 0.0), 100.0),
                signals=signals,
                raw_data=raw_data,
                success=True,
            )
        except Exception as exc:
            logger.error(
                "Scraper %s failed for handle '%s': %s",
                self.PLATFORM_NAME,
                handle,
                exc,
            )
            return ScraperResult(
                platform=self.PLATFORM_NAME,
                success=False,
                error=str(exc),
            )
