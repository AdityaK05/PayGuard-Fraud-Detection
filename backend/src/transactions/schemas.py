"""
PayGuard Backend – Transaction Schemas
========================================
Pydantic models for transaction creation, prediction results,
and dashboard data.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    """Payload for submitting a new transaction for fraud analysis."""
    type: str = Field(..., examples=["PAYMENT"])
    amount: float = Field(..., gt=0, le=10000000, examples=[2500.0])
    nameOrig: str = Field(..., examples=["C123456"])
    oldbalanceOrg: float = Field(..., examples=[5000.0])
    newbalanceOrig: float = Field(..., examples=[2500.0])
    nameDest: str = Field(..., examples=["M987654"])
    oldbalanceDest: float = Field(..., examples=[0.0])
    newbalanceDest: float = Field(..., examples=[2500.0])


class PredictionResultResponse(BaseModel):
    """Response payload for a fraud prediction."""
    transaction_id: str
    anomaly_score: float
    is_anomaly: bool
    fraud_probability: float
    risk_score: int
    risk_level: str
    prediction: str  # approved | blocked
    confidence: float
    model_version: str
    shap_explanation: Optional[dict[str, Any]] = None
    timestamp: datetime


class TransactionResponse(BaseModel):
    """Transaction record with its prediction."""
    id: int
    transaction_id: str
    type: str
    amount: float
    nameOrig: str
    nameDest: str
    status: str
    timestamp: datetime
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None

    model_config = {"from_attributes": True}


class TransactionHistoryResponse(BaseModel):
    """Paginated transaction history."""
    transactions: list[TransactionResponse]
    total: int
    page: int
    per_page: int


class DashboardStats(BaseModel):
    """Dashboard summary statistics."""
    total_transactions: int
    total_fraud: int
    total_approved: int
    total_blocked: int
    fraud_rate: float
    avg_risk_score: float
    recent_alerts: list[dict[str, Any]]
    daily_transactions: list[dict[str, Any]]
    risk_distribution: dict[str, int]
    model_metrics: dict[str, float]
