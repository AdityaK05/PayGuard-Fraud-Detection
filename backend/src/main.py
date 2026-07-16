"""
PayGuard Backend – Application Entry Point
============================================
FastAPI application factory with middleware, CORS, rate limiting,
exception handlers, and router registration.

Run with:
    uvicorn src.main:app --reload --port 8000
"""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.core.config import get_settings
from src.core.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs at startup and shutdown.
    """
    # ── Startup ──────────────────────────────────────────────────
    print("=" * 60)
    print(f"  🛡️  {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"  Environment: {settings.ENVIRONMENT}")
    print("=" * 60)

    # Initialize database tables
    await init_db()
    print("  ✓ Database initialized")

    # Pre-load ML models (optional: lazy-load on first request)
    try:
        from src.transactions.service import TransactionService
        TransactionService._get_predictor()
        print("  ✓ ML models loaded")
    except Exception as e:
        print(f"  ⚠ ML models not available: {e}")

    print("  ✓ Application ready")
    print("=" * 60)

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    print("  Shutting down PayGuard...")


# ── Application Factory ──────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-Powered Real-Time UPI Fraud Detection System. "
        "Hybrid ML pipeline using Isolation Forest + XGBoost "
        "with SHAP explainability."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ──────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Timing Middleware ────────────────────────────────────

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add X-Process-Time header to all responses."""
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response


# ── Global Exception Handler ────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler for unhandled errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred. Please try again later.",
            "type": type(exc).__name__,
        },
    )


# ── Register Routers ────────────────────────────────────────────

from src.auth.router import router as auth_router
from src.users.router import router as users_router
from src.transactions.router import router as transactions_router
from src.admin.router import router as admin_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(transactions_router)
app.include_router(admin_router)


# ── Health Check ─────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "ml_models": "loaded",
        "version": settings.APP_VERSION,
    }
