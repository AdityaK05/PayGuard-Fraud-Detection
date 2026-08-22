"""
PayGuard Backend – Security Utilities
======================================
JWT token creation/verification, password hashing, and role-based
access control decorators.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.config import get_settings

settings = get_settings()

import bcrypt

# ── Password Hashing ────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    # bcrypt limits passwords to 72 bytes
    password_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    password_bytes = plain_password[:72].encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except ValueError:
        return False


# ── JWT Tokens ──────────────────────────────────────────────────────

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Payload to encode (typically {"sub": user_id, "role": role}).
        expires_delta: Custom expiry. Defaults to settings.ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """
    Create a signed JWT refresh token with a longer expiry.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT token.

    Returns:
        Token payload if valid, None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def verify_access_token(token: str) -> Optional[dict]:
    """Verify an access token and return its payload."""
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None


def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify a refresh token and return its payload."""
    payload = decode_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None
