"""
PayGuard Backend – Auth Schemas
================================
Pydantic models for authentication request/response validation.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """User registration payload."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="user", pattern="^(user|analyst|admin)$")


class LoginRequest(BaseModel):
    """User login payload."""
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """Token refresh payload."""
    refresh_token: str


class TokenResponse(BaseModel):
    """JWT token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserResponse(BaseModel):
    """Public user representation."""
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """Combined auth response with user data and tokens."""
    user: UserResponse
    tokens: TokenResponse
