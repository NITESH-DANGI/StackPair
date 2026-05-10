"""
StackPair – JWT utility helpers.
"""

from __future__ import annotations

import jwt
from app.core.config import settings


def decode_jwt(token: str) -> dict:
    """
    Decode a Supabase JWT using PyJWT.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"verify_aud": False},
    )


def blacklist_key(token: str) -> str:
    """Redis key for a blacklisted (revoked) token."""
    return f"blacklist:{token}"


def otp_attempts_key(email: str) -> str:
    """Redis key for OTP brute-force rate limiting."""
    return f"otp_attempts:{email}"
