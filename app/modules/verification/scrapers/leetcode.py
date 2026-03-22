# ╔════════════════════════════════════════════════════════════════════════╗
# ║ WARNING — UNOFFICIAL & UNDOCUMENTED API                              ║
# ║                                                                      ║
# ║ The LeetCode GraphQL endpoint used in this scraper is UNOFFICIAL     ║
# ║ and UNDOCUMENTED.  LeetCode has NOT publicly sanctioned its use.     ║
# ║ The schema may change at ANY TIME without notice.                    ║
# ║                                                                      ║
# ║ This scraper MUST be manually tested at least ONCE PER MONTH to     ║
# ║ detect silent breakage.                                              ║
# ║                                                                      ║
# ║ If the scraper begins returning empty or malformed data, the FIRST  ║
# ║ debugging step is to inspect the GraphQL schema using a browser      ║
# ║ network tab on https://leetcode.com while navigating to a user's     ║
# ║ profile page. Check whether field names have changed.                ║
# ╚════════════════════════════════════════════════════════════════════════╝
"""
StackPair – LeetCode scraper (25 %).

Analyses:
 • Total problems solved (easy / medium / hard breakdown)
 • Contest rating and global ranking
 • Problem tags most frequently solved

Uses the unofficial LeetCode GraphQL endpoint.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.modules.verification.scrapers.base import BaseScraper

logger = logging.getLogger(__name__)

_LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

_USER_PROFILE_QUERY = """
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    tagProblemCounts {
      advanced {
        tagName
        problemsSolved
      }
      intermediate {
        tagName
        problemsSolved
      }
      fundamental {
        tagName
        problemsSolved
      }
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
    attendedContestsCount
  }
}
"""


class LeetCodeScraper(BaseScraper):
    PLATFORM_NAME = "leetcode"
    WEIGHT = 0.25

    async def fetch(self, handle: str) -> dict[str, Any]:
        payload = {
            "query": _USER_PROFILE_QUERY,
            "variables": {"username": handle},
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                _LEETCODE_GRAPHQL,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Referer": "https://leetcode.com",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        if not data.get("data", {}).get("matchedUser"):
            raise ValueError(f"LeetCode user '{handle}' not found or profile is private")

        return data["data"]

    def extract_signals(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        user = raw_data["matchedUser"]
        submissions = user.get("submitStatsGlobal", {}).get("acSubmissionNum", [])

        easy = medium = hard = 0
        for entry in submissions:
            d = entry.get("difficulty", "")
            c = entry.get("count", 0)
            if d == "Easy":
                easy = c
            elif d == "Medium":
                medium = c
            elif d == "Hard":
                hard = c

        contest = raw_data.get("userContestRanking") or {}

        # Top problem tags
        tag_counts: dict[str, int] = {}
        for level in ("fundamental", "intermediate", "advanced"):
            for tag in user.get("tagProblemCounts", {}).get(level, []):
                name = tag.get("tagName", "")
                tag_counts[name] = tag_counts.get(name, 0) + tag.get("problemsSolved", 0)
        top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "easy_solved": easy,
            "medium_solved": medium,
            "hard_solved": hard,
            "total_solved": easy + medium + hard,
            "contest_rating": contest.get("rating", 0),
            "global_ranking": contest.get("globalRanking", 0),
            "contests_attended": contest.get("attendedContestsCount", 0),
            "top_tags": [t[0] for t in top_tags],
            "ranking": user.get("profile", {}).get("ranking", 0),
        }

    def score(self, signals: dict[str, Any]) -> float:
        s = 0.0

        # Problem difficulty weighting (max 50 pts)
        easy = signals.get("easy_solved", 0)
        medium = signals.get("medium_solved", 0)
        hard = signals.get("hard_solved", 0)
        difficulty_score = (easy * 0.5) + (medium * 2.0) + (hard * 5.0)
        s += min(difficulty_score / 25 * 50, 50)

        # Contest rating (max 25 pts)
        rating = signals.get("contest_rating", 0)
        if rating >= 2400:
            s += 25
        elif rating >= 1800:
            s += 20
        elif rating >= 1400:
            s += 15
        elif rating > 0:
            s += min(rating / 1400 * 10, 10)

        # Volume bonus (max 15 pts)
        total = signals.get("total_solved", 0)
        s += min(total / 500 * 15, 15)

        # Contest participation (max 10 pts)
        s += min(signals.get("contests_attended", 0) / 20 * 10, 10)

        return min(s, 100.0)
