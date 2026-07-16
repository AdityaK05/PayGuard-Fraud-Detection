"""
PayGuard Backend – Users Router
=================================
API endpoints for user profile management.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.models import User
from src.auth.schemas import UserResponse

router = APIRouter(prefix="/user", tags=["Users"])


class ProfileUpdate(BaseModel):
    """Request body for profile updates."""
    name: str | None = Field(None, min_length=2, max_length=100)


@router.get(
    "/profile",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update current user profile",
)
async def update_profile(
    body: ProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update the authenticated user's profile fields."""
    if body.name is not None:
        current_user.name = body.name

    db.add(current_user)
    await db.flush()

    return UserResponse.model_validate(current_user)
