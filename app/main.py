"""
StackPair – FastAPI application entry-point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.redis import close_redis, init_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    await init_redis()
    yield
    # ── Shutdown ──
    await close_redis()


app = FastAPI(
    title="StackPair API",
    version="1.0.0",
    description="StackPair M-01 Auth & User Management · M-02 AI Skill Verification",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Router mounts ──────────────────────────────────────
from app.modules.auth.router import router as auth_router  # noqa: E402
from app.modules.users.router import router as users_router  # noqa: E402
from app.modules.verification.router import router as verification_router  # noqa: E402

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(verification_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

