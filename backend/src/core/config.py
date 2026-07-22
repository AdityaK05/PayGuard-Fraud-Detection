"""
PayGuard Backend – Application Configuration
=============================================
Centralized configuration management using Pydantic BaseSettings.
All secrets and environment-specific values are loaded from environment
variables or a .env file.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Application ──────────────────────────────────────────────────
    APP_NAME: str = "PayGuard"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./payguard.db"
    # For PostgreSQL: "postgresql+asyncpg://user:pass@host:5432/payguard"

    # ── Redis ────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT Authentication ───────────────────────────────────────────
    JWT_SECRET_KEY: str = "payguard-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://payguard-app-six.vercel.app",
    ]

    # ── ML Models ────────────────────────────────────────────────────
    ML_MODELS_DIR: str = "../ml/models"
    FRAUD_BLOCK_THRESHOLD: int = 70

    # ── Rate Limiting ────────────────────────────────────────────────
    RATE_LIMIT: str = "100/minute"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings instance. Called once per application lifecycle.
    """
    return Settings()
