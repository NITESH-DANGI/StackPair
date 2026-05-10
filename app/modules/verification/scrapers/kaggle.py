"""
StackPair – Kaggle scraper (15 %).

Analyses notebooks, datasets, and competition rankings.
Uses the Kaggle public API (requires KAGGLE_USERNAME + KAGGLE_KEY).
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.modules.verification.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

_BASE = "https://www.kaggle.com/api/v1"


class KaggleScraper(BaseScraper):
    PLATFORM_NAME = "kaggle"
    WEIGHT = 0.15

    def _auth(self) -> tuple[str, str]:
        return (settings.kaggle_username, settings.kaggle_key)

    async def fetch(self, handle: str) -> dict[str, Any]:
        auth = self._auth()
        async with httpx.AsyncClient(timeout=30) as client:
            # Kernels (notebooks)
            kernels_resp = await client.get(
                f"{_BASE}/kernels/list",
                params={"user": handle, "pageSize": 50},
                auth=auth,
            )
            kernels_resp.raise_for_status()
            kernels = kernels_resp.json()

            # Datasets
            datasets_resp = await client.get(
                f"{_BASE}/datasets/list",
                params={"user": handle, "pageSize": 50},
                auth=auth,
            )
            datasets_resp.raise_for_status()
            datasets = datasets_resp.json()

        return {
            "kernels": kernels if isinstance(kernels, list) else [],
            "datasets": datasets if isinstance(datasets, list) else [],
        }

    def extract_signals(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        kernels = raw_data.get("kernels", [])
        datasets = raw_data.get("datasets", [])

        total_votes = sum(k.get("totalVotes", 0) for k in kernels)
        kernel_topics: list[str] = []
        for k in kernels:
            title = k.get("title", "").lower()
            for kw in ("classification", "regression", "nlp", "image", "deep learning",
                        "eda", "visualization", "time series"):
                if kw in title and kw not in kernel_topics:
                    kernel_topics.append(kw)

        return {
            "notebook_count": len(kernels),
            "dataset_count": len(datasets),
            "total_votes": total_votes,
            "kernel_topics": kernel_topics[:5],
        }

    def score(self, signals: dict[str, Any]) -> float:
        s = 0.0
        # Notebooks (max 40 pts)
        s += min(signals.get("notebook_count", 0) / 20 * 40, 40)
        # Datasets (max 20 pts)
        s += min(signals.get("dataset_count", 0) / 10 * 20, 20)
        # Votes (max 25 pts)
        s += min(signals.get("total_votes", 0) / 100 * 25, 25)
        # Topic diversity (max 15 pts)
        s += min(len(signals.get("kernel_topics", [])) / 4 * 15, 15)
        return min(s, 100.0)
