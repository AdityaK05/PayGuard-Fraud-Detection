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
    payment_type: str = Field(..., examples=["p2p", "p2m", "bill_payment"])
    amount: float = Field(..., gt=0, le=10000000, examples=[2500.0])
    merchant_category: str = Field(..., examples=["electronics", "grocery"])
    merchant_id: str = Field(..., examples=["MER1234"])
    location_city: str = Field(..., examples=["Mumbai"])
    location_lat: float = Field(..., examples=[19.076])
    location_lng: float = Field(..., examples=[72.877])
    device_type: str = Field(..., examples=["android", "ios"])
    ip_address: str = Field(..., examples=["103.1.2.3"])
    os_type: str = Field(..., examples=["android_14"])
    bank_name: str = Field(..., examples=["HDFC"])
    timestamp: Optional[str] = None


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
    payment_type: str
    amount: float
    merchant_category: str
    merchant_id: str
    location_city: str
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
