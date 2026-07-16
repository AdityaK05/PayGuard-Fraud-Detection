"""
PayGuard Backend – Auth Service
================================
Business logic for user registration, authentication, and token management.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.models import Session, User
from src.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_refresh_token,
)

settings = get_settings()


class AuthService:
    """Authentication business logic."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(
        self,
        email: str,
        name: str,
        password: str,
        role: str = "user",
    ) -> tuple[User, dict]:
        """
        Register a new user.

        Returns:
            Tuple of (User, token_dict).

        Raises:
            ValueError if email already exists.
        """
        # Check if email is taken
        result = await self.db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            raise ValueError("An account with this email already exists")

        # Create user
        user = User(
            email=email,
            name=name,
            password_hash=hash_password(password),
            role=role,
        )
        self.db.add(user)
        await self.db.flush()  # Get the ID without committing

        # Generate tokens
        tokens = self._create_tokens(user)

        # Store session
        await self._create_session(user.id, tokens["access_token"], tokens["refresh_token"])

        return user, tokens

    async def login(self, email: str, password: str) -> tuple[User, dict]:
        """
        Authenticate a user with email and password.

        Returns:
            Tuple of (User, token_dict).

        Raises:
            ValueError if credentials are invalid.
        """
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None or not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account has been deactivated")

        tokens = self._create_tokens(user)
        await self._create_session(user.id, tokens["access_token"], tokens["refresh_token"])

        return user, tokens

    async def refresh(self, refresh_token: str) -> dict:
        """
        Refresh an access token using a valid refresh token.

        Returns:
            New token pair.

        Raises:
            ValueError if refresh token is invalid.
        """
        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise ValueError("Invalid or expired refresh token")

        user_id = payload.get("sub")
        result = await self.db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()

        if user is None or not user.is_active:
            raise ValueError("User not found or deactivated")

        tokens = self._create_tokens(user)
        await self._create_session(user.id, tokens["access_token"], tokens["refresh_token"])

        return tokens

    # ── Private helpers ──────────────────────────────────────────

    @staticmethod
    def _create_tokens(user: User) -> dict:
        """Generate access and refresh token pair."""
        token_data = {"sub": str(user.id), "role": user.role, "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token_ = create_refresh_token(token_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    async def _create_session(
        self,
        user_id: int,
        access_token: str,
        refresh_token: str,
    ) -> None:
        """Store session record in the database."""
        session = Session(
            user_id=user_id,
            token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            ),
        )
        self.db.add(session)
