"""
PayGuard Backend – Database Engine & Session Management
=======================================================
Async SQLAlchemy engine with session factory for both SQLite (local dev)
and PostgreSQL (production).
"""

from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from src.core.config import get_settings

settings = get_settings()

db_url = settings.DATABASE_URL.strip()

engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}

if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif "postgresql" in db_url or "postgres" in db_url:
    # Supabase / PgBouncer transaction pooler compatibility
    engine_kwargs["poolclass"] = NullPool
    engine_kwargs["connect_args"] = {
        "statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
    }

engine = create_async_engine(
    db_url,
    **engine_kwargs,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def init_db() -> None:
    """
    Create all tables. Called at application startup.
    In production, use Alembic migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Auto-migrate new columns for Render deployment without requiring Alembic
        from sqlalchemy import text
        columns_to_add = [
            "payment_type VARCHAR(50) DEFAULT 'p2m'",
            "amount FLOAT DEFAULT 0",
            "merchant_category VARCHAR(100) DEFAULT 'unknown'",
            "merchant_id VARCHAR(100) DEFAULT 'unknown'",
            "location_city VARCHAR(100) DEFAULT 'unknown'",
            "location_lat FLOAT DEFAULT 0",
            "location_lng FLOAT DEFAULT 0",
            "device_type VARCHAR(50) DEFAULT 'unknown'",
            "ip_address VARCHAR(50) DEFAULT 'unknown'",
            "os_type VARCHAR(50) DEFAULT 'unknown'",
            "bank_name VARCHAR(100) DEFAULT 'unknown'"
        ]
        
        if "postgresql" in settings.DATABASE_URL or "postgres" in settings.DATABASE_URL:
            # PostgreSQL supports ADD COLUMN IF NOT EXISTS
            for col in columns_to_add:
                try:
                    await conn.execute(text(f"ALTER TABLE transactions ADD COLUMN IF NOT EXISTS {col}"))
                except Exception:
                    pass
                    
            # Drop old obsolete columns that cause IntegrityError (violating NOT NULL constraint)
            old_columns = [
                '"type"', '"nameOrig"', '"nameDest"', '"oldbalanceOrg"', 
                '"newbalanceOrig"', '"oldbalanceDest"', '"newbalanceDest"', 
                '"isFraud"', '"isFlaggedFraud"'
            ]
            for col in old_columns:
                try:
                    await conn.execute(text(f"ALTER TABLE transactions DROP COLUMN IF EXISTS {col} CASCADE"))
                except Exception:
                    pass
        else:
            # SQLite workaround
            for col in columns_to_add:
                try:
                    await conn.execute(text(f"ALTER TABLE transactions ADD COLUMN {col}"))
                except Exception:
                    pass


async def get_db() -> AsyncSession:
    """
    Dependency that provides a database session.
    Automatically commits on success or rolls back on error.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
