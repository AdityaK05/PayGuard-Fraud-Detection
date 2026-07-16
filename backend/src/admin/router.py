"""
PayGuard Backend – Admin Router
=================================
API endpoints for admin operations: analytics, user management,
model performance, retraining, and dataset upload.
"""

import json
import os
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.dependencies import require_admin
from src.core.models import Alert, Log, MLModel, Prediction, Transaction, User

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Response Models ──────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_transactions: int
    total_fraud: int
    total_blocked: int
    fraud_rate: float
    avg_risk_score: float
    active_users: int
    model_version: str
    risk_distribution: dict[str, int]
    recent_fraud: list[dict[str, Any]]


class UserItem(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    transaction_count: int

    model_config = {"from_attributes": True}


class ModelPerformance(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    model_version: str
    confusion_matrix: list[list[int]]
    feature_importance: dict[str, float]


# ── Endpoints ────────────────────────────────────────────────────

@router.get(
    "/stats",
    response_model=AdminStats,
    summary="Get system-wide analytics",
)
async def get_admin_stats(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get aggregate statistics across all users and transactions."""
    # Total users
    user_count = (await db.execute(
        select(func.count()).select_from(User)
    )).scalar() or 0

    active_users = (await db.execute(
        select(func.count()).select_from(User).where(User.is_active == True)
    )).scalar() or 0

    # Total transactions
    tx_count = (await db.execute(
        select(func.count()).select_from(Transaction)
    )).scalar() or 0

    # Fraud / blocked
    fraud_count = (await db.execute(
        select(func.count()).select_from(Transaction).where(
            Transaction.status == "blocked"
        )
    )).scalar() or 0

    # Avg risk score
    avg_risk = (await db.execute(
        select(func.avg(Prediction.risk_score))
    )).scalar() or 0.0

    # Risk distribution
    risk_dist = {"safe": 0, "medium": 0, "fraud": 0}
    dist_result = await db.execute(
        select(Prediction.risk_level, func.count()).group_by(Prediction.risk_level)
    )
    for level, count in dist_result.all():
        if level in risk_dist:
            risk_dist[level] = count

    # Recent fraud transactions
    recent_result = await db.execute(
        select(Transaction)
        .where(Transaction.status == "blocked")
        .order_by(Transaction.timestamp.desc())
        .limit(10)
    )
    recent_fraud = [
        {
            "transaction_id": tx.transaction_id,
            "amount": tx.amount,
            "merchant_category": tx.merchant_category,
            "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
            "risk_score": tx.prediction.risk_score if tx.prediction else None,
        }
        for tx in recent_result.scalars().all()
    ]

    # Model version
    metrics_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "training_metrics.json")
    )
    model_version = "N/A"
    try:
        with open(metrics_path) as f:
            model_version = json.load(f).get("model_version", "N/A")
    except FileNotFoundError:
        pass

    return AdminStats(
        total_users=user_count,
        total_transactions=tx_count,
        total_fraud=fraud_count,
        total_blocked=fraud_count,
        fraud_rate=round(fraud_count / max(tx_count, 1), 4),
        avg_risk_score=round(float(avg_risk), 2),
        active_users=active_users,
        model_version=model_version,
        risk_distribution=risk_dist,
        recent_fraud=recent_fraud,
    )


@router.get(
    "/users",
    response_model=list[UserItem],
    summary="List all users",
)
async def list_users(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a list of all registered users with their transaction counts."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()

    items = []
    for user in users:
        tx_count = (await db.execute(
            select(func.count()).select_from(Transaction).where(
                Transaction.user_id == user.id
            )
        )).scalar() or 0

        items.append(UserItem(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_active=user.is_active,
            transaction_count=tx_count,
        ))

    return items


@router.get(
    "/model/performance",
    response_model=ModelPerformance,
    summary="Get ML model performance metrics",
)
async def get_model_performance(
    admin: Annotated[User, Depends(require_admin)],
):
    """Return the trained model's evaluation metrics."""
    metrics_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "training_metrics.json")
    )

    try:
        with open(metrics_path) as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metrics not found. Train the model first.",
        )

    # Load feature importance from XGBoost
    feature_importance = {}
    try:
        import joblib
        import numpy as np
        models_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models")
        )
        xgb = joblib.load(os.path.join(models_dir, "XGBoost.pkl"))
        columns = joblib.load(os.path.join(models_dir, "feature_columns.pkl"))
        importances = xgb.feature_importances_
        for i, col in enumerate(columns):
            feature_importance[col] = round(float(importances[i]), 4)
    except Exception:
        pass

    return ModelPerformance(
        accuracy=data.get("accuracy", 0),
        precision=data.get("precision", 0),
        recall=data.get("recall", 0),
        f1_score=data.get("f1_score", 0),
        roc_auc=data.get("roc_auc", 0),
        model_version=data.get("model_version", "N/A"),
        confusion_matrix=data.get("confusion_matrix", [[0, 0], [0, 0]]),
        feature_importance=feature_importance,
    )


@router.post(
    "/retrain",
    summary="Trigger model retraining",
)
async def retrain_model(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Trigger a model retrain using the latest dataset.
    In production, this would queue a background job.
    """
    # Log the retrain action
    log = Log(
        action="model_retrain",
        user_id=admin.id,
        details="Model retrain triggered by admin",
    )
    db.add(log)

    return {
        "status": "queued",
        "message": "Model retraining has been queued. This may take several minutes.",
    }


@router.post(
    "/upload-dataset",
    summary="Upload a new training dataset",
)
async def upload_dataset(
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    """Upload a CSV dataset for model training."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted",
        )

    datasets_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "datasets")
    )
    os.makedirs(datasets_dir, exist_ok=True)

    file_path = os.path.join(datasets_dir, "uploaded_dataset.csv")
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    log = Log(
        action="dataset_upload",
        user_id=admin.id,
        details=f"Uploaded dataset: {file.filename} ({len(content)} bytes)",
    )
    db.add(log)

    return {
        "status": "uploaded",
        "filename": file.filename,
        "size_bytes": len(content),
        "message": "Dataset uploaded successfully. Trigger /admin/retrain to use it.",
    }
