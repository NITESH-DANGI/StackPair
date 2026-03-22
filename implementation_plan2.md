# M-02 · AI Skill Verification Engine — Implementation Plan

Implements the M-02 PRD: background AI-powered skill verification for StackPair users. Analyses GitHub, LeetCode, Kaggle, Codeforces, Stack Overflow, and portfolio URLs via scrapers + Claude API. Runs as Celery tasks, writes results to M-01 via internal endpoint.

## Proposed Changes

### 1. Config & Environment

#### [MODIFY] [config.py](file:///c:/StackPair/app/core/config.py)
Add new env vars: `GITHUB_PAT`, `STACKOVERFLOW_KEY`, `KAGGLE_USERNAME`, `KAGGLE_KEY`, `CODEFORCES_KEY`, `CODEFORCES_SECRET`, `CLAUDE_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `VERIFICATION_BATCH_SIZE`.

#### [MODIFY] [.env.example](file:///c:/StackPair/.env.example)
Add all new env vars with example values.

---

### 2. Database (Alembic Migration)

#### [NEW] `alembic/versions/002_m02_verification_tables.py`
- Create `verify_status` ENUM: `PENDING, RUNNING, COMPLETE, FAILED, SKIPPED`
- Create `verification_runs` table (14 columns — id, user_id, status, trigger, sources_attempted, sources_succeeded, raw_scores, final_score, detected_primary_skill, normalised_primary_skill, assigned_level, error_detail, started_at, completed_at)
- Create `user_platform_handles` table (6 columns — id, user_id, platform, handle, verified, last_checked_at)
- Create `skill_benchmarks` table (8 columns — id, skill_category, quarter, avg_required_level, min/max_required_level, jd_sample_size, top_secondary_skills, created_at)
- Add `inactivity_warnings SMALLINT DEFAULT 0` column to `user_profiles`
- Add `last_verified_at TIMESTAMPTZ` column to `user_profiles`

---

### 3. ORM Models

#### [MODIFY] [models.py](file:///c:/StackPair/app/modules/users/models.py)
- Add `inactivity_warnings` and `last_verified_at` columns to [UserProfile](file:///c:/StackPair/app/modules/users/models.py#120-169)

#### [NEW] `app/modules/verification/models.py`
- `VerifyStatus` ENUM
- `VerificationRun` model
- `UserPlatformHandle` model
- `SkillBenchmark` model

---

### 4. Celery Setup

#### [NEW] `app/core/celery_app.py`
- Celery app instance using Upstash Redis as broker
- Beat schedule: weekly `verify_user_batch` (Sunday 02:00 UTC), quarterly `scrape_industry_benchmarks` (1st of Jan/Apr/Jul/Oct 03:00 UTC)
- Retry policy: max 3 retries, exponential backoff starting at 60s

---

### 5. Scrapers (`app/modules/verification/scrapers/`)

#### [NEW] [base.py](file:///c:/StackPair/app/core/database.py) — Abstract base scraper
- `fetch(handle)` → raw data
- `extract_signals(raw_data)` → structured signals
- `score(signals)` → 0–100 normalised score
- Class constants: `WEIGHT`, `PLATFORM_NAME`

#### [NEW] `github.py` — GitHub scraper (35%)
- REST API v3 via `GITHUB_PAT`
- Analyses: language distribution, commits (12mo), stars, repo quality, account age
- Rate limit checking via `X-RateLimit-Remaining` header

#### [NEW] `leetcode.py` — LeetCode scraper (25%)
- GraphQL endpoint
- Problem count by difficulty (easy/med/hard), contest rating, problem tags

#### [NEW] `kaggle.py` — Kaggle scraper (15%)
- Kaggle public API
- Notebooks, datasets, competition rankings

#### [NEW] `codeforces.py` — Codeforces scraper (10%)
- Codeforces API
- Rating, max rank, contest history

#### [NEW] `stackoverflow.py` — Stack Overflow scraper (10%)
- Stack Exchange API v2.3
- Reputation, top tags, answer acceptance rate

#### [NEW] `portfolio.py` — Portfolio analyser (5%)
- Fetches portfolio URL via httpx
- Claude API (`claude-sonnet-4-6`) extracts tech domain + frameworks + proficiency

---

### 6. Scoring & Normalisation

#### [NEW] `app/modules/verification/scorer.py`
- Weighted aggregation of all source scores
- Partial re-weighting when sources fail
- Level mapping: 0→(0-9), 1→(10-29), 2→(30-49), 3→(50-69), 4→(70-84), 5→(85-100)
- Anti-gaming: burst detection (5x spike vs 90-day avg), cross-source consistency

#### [NEW] `app/modules/verification/normaliser.py`
- Claude API call with allowed skill labels list
- Raw signals → single clean label (e.g. "Python Backend")
- Allowed labels stored in config file

---

### 7. Service & Tasks

#### [NEW] `app/modules/verification/service.py`
- Orchestrator: runs all scrapers → scorer → normaliser → calls M-01 PUT endpoint
- Handles partial failures, records to `verification_runs`

#### [NEW] `app/modules/verification/tasks.py`
- `verify_user_skill(user_id)` — single user verification
- `verify_user_batch()` — weekly batch: fetch eligible users, fan out tasks (batches of 50)
- Retry policy: max 3, exponential backoff 60s, DLQ on final failure
- Inactivity level-down logic (60d warn, 90d warn, 120d reduce by 1)

---

### 8. Benchmarks Module

#### [NEW] `app/modules/benchmarks/__init__.py`, [service.py](file:///c:/StackPair/app/modules/auth/service.py), `tasks.py`, `scraper.py`
- JD scraping from public job boards per skill category
- Claude API batch processing (20 JDs at a time)
- Write to `skill_benchmarks` table
- Quarterly Celery beat task

---

### 9. Schemas & Router

#### [NEW] `app/modules/verification/schemas.py`
- Request/response models for all 8 endpoints
- `PlatformHandleItem`, `SubmitPlatformsRequest`, `VerificationStatusResponse`, `VerificationRunResponse`, `TriggerBatchRequest`, `BenchmarkResponse`

#### [NEW] `app/modules/verification/router.py`
8 endpoints per PRD:

| Method | Path | Auth |
|--------|------|------|
| POST | `/internal/verification/trigger/{user_id}` | INTERNAL_SERVICE_TOKEN |
| GET | `/internal/verification/status/{user_id}` | INTERNAL_SERVICE_TOKEN |
| GET | `/internal/verification/runs/{user_id}` | INTERNAL_SERVICE_TOKEN |
| POST | `/admin/verification/trigger-batch` | ADMIN role |
| GET | `/admin/benchmarks` | ADMIN role |
| POST | `/admin/benchmarks/refresh` | ADMIN role |
| PUT | `/users/me/platforms` | User JWT + ACTIVE |
| GET | `/users/me/verification-status` | User JWT + ACTIVE |

#### [MODIFY] [main.py](file:///c:/StackPair/app/main.py)
- Mount verification router at `/api/v1`

---

### 10. Allowed Skill Labels Config

#### [NEW] `app/modules/verification/skill_labels.py`
Predefined list:
```
Python Backend, Frontend (React), Data Science, Competitive Programming,
DevOps / Infrastructure, Android Development, Machine Learning,
Full Stack, iOS Development, Frontend (Vue), Frontend (Angular),
Java Backend, Go Backend, Rust, Embedded Systems, Blockchain,
Cloud Architecture, Data Engineering, Cybersecurity, Game Development
```

---

## Verification Plan

### Automated Tests
1. `python -c "from app.main import app"` — verify no import errors
2. Start server with `uvicorn app.main:app` — verify all routes register
3. Check `/openapi.json` for all 8 new endpoints
4. Run Alembic migration: `alembic upgrade head`

### Manual Verification
- Test `PUT /users/me/platforms` with mock JWT
- Test `GET /users/me/verification-status`
- Verify Celery worker starts without errors
