# StackPair M-01: Auth & User Management — Implementation Plan

Build the complete Auth & User Management backend module for StackPair, based on the PRD (v1.0.0). This is a greenfield FastAPI project using Supabase Auth, PostgreSQL (via async SQLAlchemy), and Redis caching.

## User Review Required

> [!IMPORTANT]
> **Supabase credentials needed:** The code will reference env vars like `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `UPSTASH_REDIS_URL`, `DATABASE_URL`, etc. You will need to populate a `.env` file with real values before running the server.

> [!WARNING]
> **PyJWT vs python-jose:** The user's requirements specify `PyJWT==2.12.1` (not `python-jose` which is deprecated). The PRD code samples reference `python-jose` but we will use `PyJWT` instead, adapting the import to `import jwt`.

---

## Proposed Changes

### Phase 1 — Project Scaffold & Database

#### [NEW] [requirements.txt](file:///c:/StackPair/requirements.txt)
All dependencies from user's message, written verbatim.

#### [NEW] [.env.example](file:///c:/StackPair/.env.example)
Template with all 10 env vars from PRD §10.1.

#### [NEW] [app/\_\_init\_\_.py](file:///c:/StackPair/app/__init__.py)
Empty init for the app package.

#### [NEW] [app/main.py](file:///c:/StackPair/app/main.py)
- FastAPI app with CORS, lifespan (init Redis pool on startup)
- Mount routers: `auth.router`, `users.router`

#### [NEW] [app/core/config.py](file:///c:/StackPair/app/core/config.py)
- `pydantic-settings` `Settings` class with all env vars
- Typed fields with validation and defaults where applicable

#### [NEW] [app/core/database.py](file:///c:/StackPair/app/core/database.py)
- `create_async_engine` with `DATABASE_URL`
- `async_sessionmaker` + `get_db` async dependency

#### [NEW] [app/core/redis.py](file:///c:/StackPair/app/core/redis.py)
- Redis async client singleton via `redis.asyncio`
- `get_redis` dependency for injection

#### [NEW] [app/core/dependencies.py](file:///c:/StackPair/app/core/dependencies.py)
- `get_current_user` — validates Bearer JWT via PyJWT, checks Redis blacklist, loads user from DB/cache
- `has_role(role)` — factory returning a dependency that checks the user's role
- `require_active` — ensures `onboarding_state == ACTIVE`

#### [NEW] [app/modules/\_\_init\_\_.py](file:///c:/StackPair/app/modules/__init__.py)
Empty init.

#### [NEW] [app/modules/users/\_\_init\_\_.py](file:///c:/StackPair/app/modules/users/__init__.py)
Empty init.

#### [NEW] [app/modules/auth/\_\_init\_\_.py](file:///c:/StackPair/app/modules/auth/__init__.py)
Empty init.

#### [NEW] [app/modules/users/models.py](file:///c:/StackPair/app/modules/users/models.py)
SQLAlchemy ORM models matching PRD §6:
- `UserRole` enum, `OnboardingState` enum
- `User` model (§6.1) — all 12 columns
- `UserProfile` model (§6.2) — all 13 columns
- `UserSocialLink` model (§6.3) — 5 columns
- `Session` model (§6.4) — 6 columns

#### [NEW] [alembic.ini](file:///c:/StackPair/alembic.ini)
Standard Alembic config pointing to `app.core.database`.

#### [NEW] [alembic/env.py](file:///c:/StackPair/alembic/env.py)
Async Alembic env using the same engine as the app.

#### [NEW] [alembic/versions/001_m01_auth_tables.py](file:///c:/StackPair/alembic/versions/001_m01_auth_tables.py)
Migration M-01-001 per PRD §10.3:
1. Create ENUMs → 2. Create tables → 3. Create indexes → 4. Create `updated_at` trigger

---

### Phase 2 — Auth Endpoints

#### [NEW] [app/modules/auth/schemas.py](file:///c:/StackPair/app/modules/auth/schemas.py)
Pydantic models per PRD §8:
- `RegisterRequest` / `RegisterResponse`
- `VerifyOTPRequest` / `AuthResponse` (with nested `UserBrief`)
- `RefreshRequest` / `RefreshResponse`
- `GitHubCallbackRequest`

#### [NEW] [app/modules/auth/utils.py](file:///c:/StackPair/app/modules/auth/utils.py)
- `decode_jwt(token)` — PyJWT decode with HS256
- `create_blacklist_key(token)` helper

#### [NEW] [app/modules/auth/service.py](file:///c:/StackPair/app/modules/auth/service.py)
- `send_otp(email)` — calls `supabase.auth.sign_in_with_otp`
- `verify_otp(email, otp)` — calls `supabase.auth.verify_otp`, creates/fetches user row
- `github_oauth_url()` — returns Supabase GitHub OAuth URL
- `github_callback(code)` — exchanges code for session, creates user on first login
- `refresh_token(refresh_token)` — calls `supabase.auth.refresh_session`
- `logout(token, user_id)` — blacklists token in Redis, marks session revoked
- `logout_all(user_id)` — revokes all sessions in DB, blacklists current token
- OTP brute-force rate limiting via Redis INCR (§11.1)

#### [NEW] [app/modules/auth/router.py](file:///c:/StackPair/app/modules/auth/router.py)
All 7 routes from PRD §7.1:
- `POST /auth/register`, `POST /auth/verify-otp`
- `POST /auth/github`, `POST /auth/github/callback`
- `POST /auth/refresh`
- `POST /auth/logout`, `POST /auth/logout-all`

---

### Phase 3 — User & Onboarding Endpoints

#### [NEW] [app/modules/users/schemas.py](file:///c:/StackPair/app/modules/users/schemas.py)
- `UserResponse`, `UserProfileResponse`, `UserMeResponse` (nested profile)
- `UpdateUserRequest`, `UpdateProfileRequest`, `UpsertSocialLinksRequest`
- `OnboardingProfileRequest`, `OnboardingSkillsRequest`, `OnboardingGoalsRequest`
- Admin: `SuspendRequest`, `UpdateRoleRequest`, `UserListResponse`

#### [NEW] [app/modules/users/service.py](file:///c:/StackPair/app/modules/users/service.py)
- `get_by_auth_id`, `get_by_username`, `get_by_id` — with Redis caching
- `update_user`, `update_profile`, `upsert_social_links`
- Onboarding state machine: `advance_onboarding(user, step)` — validates valid transitions per §10.6
- `soft_delete_user` — sets `is_active=False`, `deleted_at=now()`
- `hard_delete_user` — Celery task for T+30d purge
- Admin: `suspend_user`, `reinstate_user`, `update_role`
- Cache invalidation on every write

#### [NEW] [app/modules/users/router.py](file:///c:/StackPair/app/modules/users/router.py)
All routes from PRD §7.2–7.4:
- **Profile:** `GET /users/me`, `PUT /users/me`, `GET /users/{username}`, `GET /users/me/profile`, `PUT /users/me/profile`, `PUT /users/me/social-links`, `DELETE /users/me`
- **Onboarding:** `GET /onboarding/state`, `POST /onboarding/profile`, `POST /onboarding/skills`, `POST /onboarding/goals`, `POST /onboarding/complete`
- **Admin:** `POST /admin/users/{id}/suspend`, `POST /admin/users/{id}/reinstate`, `POST /admin/users/{id}/role`, `GET /admin/users`

---

### Phase 4 — Hardening

#### [NEW] [app/modules/auth/rate_limit.py](file:///c:/StackPair/app/modules/auth/rate_limit.py)
- OTP brute force protection (max 5 attempts / 10min per email)
- Returns HTTP 429 with `Retry-After` header

#### [MODIFY] [app/modules/auth/service.py](file:///c:/StackPair/app/modules/auth/service.py)
- Integrate rate limiting into `verify_otp()`
- Add GitHub OAuth CSRF state validation (Redis-backed state param)

---

## Verification Plan

### Automated Tests

#### Test 1 — Server startup
```bash
cd c:\StackPair
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Visit `http://localhost:8000/docs` — verify Swagger UI loads with all routes listed.

#### Test 2 — Alembic migration dry run
```bash
cd c:\StackPair
alembic check
```
Verify no errors. (Full migration requires a live Supabase Postgres connection.)

### Manual Verification

1. **Review Swagger docs** — After starting the server, open `http://localhost:8000/docs` in the browser. Confirm all 22 endpoints appear under the correct groups (Auth, Users, Onboarding, Admin).
2. **Schema validation** — Try sending an invalid body (e.g. `{"email": "not-an-email"}`) to `POST /auth/register` and confirm a 422 validation error is returned.
3. **End-to-end flow** — Requires a configured Supabase project. The user should:
   - Call `POST /auth/register` with a real email
   - Copy the OTP from inbox
   - Call `POST /auth/verify-otp`
   - Walk through each onboarding step
   - Call `GET /users/me` to see the complete profile
