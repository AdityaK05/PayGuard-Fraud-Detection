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
    upi_id: str = Field(..., min_length=3, max_length=100, examples=["user001@oksbi"])
    amount: float = Field(..., gt=0, le=100000, examples=[2500.0])
    merchant_category: str = Field(..., examples=["grocery"])
    merchant_id: str = Field(..., examples=["MER1234"])
    location_city: str = Field(default="Mumbai", examples=["Mumbai"])
    location_lat: float = Field(default=19.076, examples=[19.076])
    location_lng: float = Field(default=72.877, examples=[72.877])
    payment_type: str = Field(..., examples=["p2m"])
    device_type: str = Field(default="android", examples=["android"])
    ip_address: str = Field(default="0.0.0.0", examples=["103.45.67.89"])
    os_type: str = Field(default="android_14", examples=["android_14"])
    bank_name: str = Field(default="SBI", examples=["SBI"])


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
    upi_id: str
    amount: float
    merchant_category: str
    location_city: Optional[str]
    payment_type: str
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
