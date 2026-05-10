"""
StackPair – Redis (Upstash) async client singleton.
"""

from __future__ import annotations

import redis.asyncio as aioredis

from app.core.config import settings

# Module-level reference; initialised in lifespan.
_redis_client: aioredis.Redis | None = None


async def init_redis() -> aioredis.Redis:
    """Create the global Redis connection pool.  Called once on app startup."""
    global _redis_client
    _redis_client = aioredis.from_url(
        settings.upstash_redis_url,
        decode_responses=True,
    )
    return _redis_client


async def close_redis() -> None:
    """Gracefully close the pool.  Called on app shutdown."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()  # type: ignore[union-attr]
        _redis_client = None


async def get_redis() -> aioredis.Redis:  # type: ignore[misc]
    """FastAPI dependency – returns the shared Redis client."""
    if _redis_client is None:
        raise RuntimeError("Redis client not initialised – call init_redis() first")
    return _redis_client
