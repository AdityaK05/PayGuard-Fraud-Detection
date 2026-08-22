"""
PayGuard Backend – Transactions Router
========================================
API endpoints for transaction submission, history, and dashboard.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from src.main import limiter

from src.core.database import get_db
from src.core.dependencies import get_current_user
from src.core.models import User
from src.transactions.schemas import (
    DashboardStats,
    PredictionResultResponse,
    TransactionCreate,
    TransactionHistoryResponse,
)
from src.transactions.service import TransactionService

router = APIRouter(tags=["Transactions"])


@router.post(
    "/predict",
    response_model=PredictionResultResponse,
    summary="Submit transaction for fraud prediction",
)
@limiter.limit("10/minute")
async def predict_transaction(
    request: Request,
    body: TransactionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Submit a UPI transaction for real-time fraud analysis.

    Pipeline: Preprocess → Feature Engineer → Isolation Forest →
    XGBoost → Risk Score → Decision Engine → Response

    Returns the full prediction result including risk score (0–100),
    fraud probability, SHAP explanation, and approve/block decision.
    """
    service = TransactionService(db)
    result = await service.create_and_predict(
        user=current_user,
        data=body.model_dump(),
    )
    return PredictionResultResponse(**result)


@router.get(
    "/transactions",
    response_model=TransactionHistoryResponse,
    summary="Get transaction history",
)
async def get_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Get paginated transaction history for the authenticated user."""
    service = TransactionService(db)
    return await service.get_user_transactions(
        user_id=current_user.id,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/history",
    response_model=TransactionHistoryResponse,
    summary="Get transaction history (alias)",
)
async def get_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Alias for /transactions endpoint."""
    service = TransactionService(db)
    return await service.get_user_transactions(
        user_id=current_user.id,
        page=page,
        per_page=per_page,
    )


@router.get(
    "/dashboard",
    response_model=DashboardStats,
    summary="Get dashboard statistics",
)
async def get_dashboard(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get dashboard summary statistics for the authenticated user."""
    service = TransactionService(db)
    return await service.get_dashboard_stats(user_id=current_user.id)
