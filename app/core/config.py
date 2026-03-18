"""
StackPair – Application Settings
Loads all environment variables via pydantic-settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Supabase ────────────────────────────────
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # ── JWT ──────────────────────────────────────
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60       # 1 hour
    refresh_token_expire_days: int = 30

    # ── Database ────────────────────────────────
    database_url: str  # postgresql+asyncpg://...

    # ── Redis (Upstash) ─────────────────────────
    upstash_redis_url: str

    # ── GitHub OAuth ────────────────────────────
    github_client_id: str = ""
    github_client_secret: str = ""

    # ── Google OAuth ────────────────────────────
    google_redirect_uri: str = ""

    # ── Internal Service Auth ───────────────────
    internal_service_token: str = ""

    # ── Email ───────────────────────────────────
    resend_api_key: str = ""

    # ── App ─────────────────────────────────────
    app_name: str = "StackPair"
    debug: bool = False


settings = Settings()  # type: ignore[call-arg]
