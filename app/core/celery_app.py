"""
StackPair – Single shared Celery application instance (Fix 2).

ALL Celery tasks across the entire project MUST import from this module.
No other file may instantiate a Celery app object.

Broker & result backend: Upstash Redis (UPSTASH_REDIS_URL).
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "stackpair",
    broker=settings.upstash_redis_url,
    backend=settings.upstash_redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Default retry policy for all tasks
    task_default_retry_delay=60,
    task_max_retries=3,
)

# ── Auto-discover tasks from all modules ───────────────
celery_app.autodiscover_tasks([
    "app.modules.verification",
    "app.modules.benchmarks",
])

# ── Beat schedule ──────────────────────────────────────
celery_app.conf.beat_schedule = {
    # M-02: Weekly user verification batch — Sunday 02:00 UTC
    "weekly-verify-users": {
        "task": "app.modules.verification.tasks.verify_user_batch",
        "schedule": crontab(hour=2, minute=0, day_of_week=0),  # Sunday
    },
    # M-02: Quarterly industry benchmark scrape — 1st of Jan/Apr/Jul/Oct 03:00 UTC
    "quarterly-benchmarks": {
        "task": "app.modules.benchmarks.tasks.scrape_industry_benchmarks",
        "schedule": crontab(hour=3, minute=0, day_of_month=1, month_of_year="1,4,7,10"),
    },
    # M-01: Hard delete cleanup — daily 04:00 UTC (purge users deleted 30+ days ago)
    "daily-hard-delete-cleanup": {
        "task": "app.modules.users.tasks.hard_delete_expired_users",
        "schedule": crontab(hour=4, minute=0),
    },
}
