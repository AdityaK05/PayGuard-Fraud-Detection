"""
PayGuard Backend – SQLAlchemy ORM Models
=========================================
Defines all 10 database tables:
  Users, Sessions, Transactions, Predictions, RiskScores,
  Alerts, Logs, Feedback, Models, Admins
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    func,
)
from sqlalchemy.orm import relationship

from src.core.database import Base


def utcnow() -> datetime:
    """Return the current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


# ═══════════════════════════════════════════════════════════════════
# Users
# ═══════════════════════════════════════════════════════════════════

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user")  # user, analyst, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", lazy="selectin")
    sessions = relationship("Session", back_populates="user", lazy="selectin")
    alerts = relationship("Alert", back_populates="user", lazy="selectin")


# ═══════════════════════════════════════════════════════════════════
# Sessions
# ═══════════════════════════════════════════════════════════════════

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="sessions")


# ═══════════════════════════════════════════════════════════════════
# Transactions
# ═══════════════════════════════════════════════════════════════════

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    transaction_id = Column(String(100), unique=True, index=True)
    
    # New Real Dataset Fields
    type = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    nameOrig = Column(String(100), nullable=False)
    oldbalanceOrg = Column(Float, nullable=False)
    newbalanceOrig = Column(Float, nullable=False)
    nameDest = Column(String(100), nullable=False)
    oldbalanceDest = Column(Float, nullable=False)
    newbalanceDest = Column(Float, nullable=False)
    
    status = Column(String(20), default="pending")  # approved, blocked, pending
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions")
    prediction = relationship("Prediction", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="transaction", lazy="selectin")


# ═══════════════════════════════════════════════════════════════════
# Predictions
# ═══════════════════════════════════════════════════════════════════

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    is_anomaly = Column(Boolean, default=False)
    fraud_probability = Column(Float, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)  # safe, medium, fraud
    prediction = Column(String(20), nullable=False)  # approved, blocked
    confidence = Column(Float, nullable=False)
    model_version = Column(String(20), nullable=False)
    shap_explanation = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    transaction = relationship("Transaction", back_populates="prediction")
    risk_score_record = relationship("RiskScore", back_populates="prediction", uselist=False, lazy="selectin")
    feedback = relationship("Feedback", back_populates="prediction", lazy="selectin")


# ═══════════════════════════════════════════════════════════════════
# Risk Scores
# ═══════════════════════════════════════════════════════════════════

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), unique=True, nullable=False)
    score = Column(Integer, nullable=False)  # 0–100
    risk_level = Column(String(20), nullable=False)
    threshold_applied = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    prediction = relationship("Prediction", back_populates="risk_score_record")


# ═══════════════════════════════════════════════════════════════════
# Alerts
# ═══════════════════════════════════════════════════════════════════

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    alert_type = Column(String(50), nullable=False)  # fraud_detected, suspicious, info
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="alerts")
    transaction = relationship("Transaction", back_populates="alerts")


# ═══════════════════════════════════════════════════════════════════
# Logs
# ═══════════════════════════════════════════════════════════════════

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=utcnow)


# ═══════════════════════════════════════════════════════════════════
# Feedback
# ═══════════════════════════════════════════════════════════════════

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    correct_label = Column(Integer, nullable=False)  # 0 = legitimate, 1 = fraud
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    prediction = relationship("Prediction", back_populates="feedback")


# ═══════════════════════════════════════════════════════════════════
# Models (ML Model Registry)
# ═══════════════════════════════════════════════════════════════════

class MLModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utcnow)


# ═══════════════════════════════════════════════════════════════════
# Admins
# ═══════════════════════════════════════════════════════════════════

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    permissions = Column(JSON, default=list)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
