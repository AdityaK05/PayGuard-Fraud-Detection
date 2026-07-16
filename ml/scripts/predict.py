"""
PayGuard – Real-Time Prediction Module
========================================
Loads trained model artifacts and provides a prediction function that
processes a single transaction through the full ML pipeline:

  Raw input → Preprocess → Feature Engineer → Isolation Forest anomaly score
  → XGBoost probability → Risk Score (0–100) → Decision

This module is used by the FastAPI backend for real-time inference.
"""

import os
import sys
from dataclasses import dataclass
from typing import Optional

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))

from preprocessing import DataPreprocessor
from feature_engineering import FeatureEngineer

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# ---------------------------------------------------------------------------
# Risk thresholds
# ---------------------------------------------------------------------------
RISK_THRESHOLDS = {
    "safe": (0, 30),
    "medium": (31, 60),
    "fraud": (61, 100),
}

# Default blocking threshold
DEFAULT_BLOCK_THRESHOLD = 70


@dataclass
class PredictionResult:
    """Encapsulates the complete result of a fraud prediction."""
    transaction_id: str
    anomaly_score: float           # Raw Isolation Forest decision function score
    is_anomaly: bool               # Whether IF flagged it as anomalous
    fraud_probability: float       # XGBoost probability of fraud [0, 1]
    risk_score: int                # Mapped to 0–100 scale
    risk_level: str                # "safe", "medium", or "fraud"
    prediction: str                # "approved" or "blocked"
    confidence: float              # Model confidence (max of class probabilities)
    model_version: str
    feature_contributions: Optional[dict] = None  # SHAP values (filled separately)

    def to_dict(self) -> dict:
        """Serialize to a dictionary for API responses."""
        return {
            "transaction_id": self.transaction_id,
            "anomaly_score": round(self.anomaly_score, 4),
            "is_anomaly": self.is_anomaly,
            "fraud_probability": round(self.fraud_probability, 4),
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "prediction": self.prediction,
            "confidence": round(self.confidence, 4),
            "model_version": self.model_version,
            "feature_contributions": self.feature_contributions,
        }


class FraudPredictor:
    """
    Singleton-style predictor that loads models once and serves predictions.

    Usage:
        predictor = FraudPredictor.load()
        result = predictor.predict(transaction_data)
    """

    def __init__(
        self,
        preprocessor: DataPreprocessor,
        feature_engineer: FeatureEngineer,
        iso_model,
        xgb_model,
        feature_columns: list[str],
        model_version: str = "1.0.0",
        block_threshold: int = DEFAULT_BLOCK_THRESHOLD,
    ):
        self.preprocessor = preprocessor
        self.feature_engineer = feature_engineer
        self.iso_model = iso_model
        self.xgb_model = xgb_model
        self.feature_columns = feature_columns
        self.model_version = model_version
        self.block_threshold = block_threshold

    @classmethod
    def load(cls, models_dir: Optional[str] = None) -> "FraudPredictor":
        """Load all model artifacts from disk."""
        load_dir = models_dir or MODELS_DIR

        preprocessor = DataPreprocessor.load(load_dir)
        feature_engineer = FeatureEngineer()
        iso_model = joblib.load(os.path.join(load_dir, "IsolationForest.pkl"))
        xgb_model = joblib.load(os.path.join(load_dir, "XGBoost.pkl"))
        feature_columns = joblib.load(os.path.join(load_dir, "feature_columns.pkl"))

        # Load model version from metrics if available
        import json
        metrics_file = os.path.join(load_dir, "training_metrics.json")
        version = "1.0.0"
        if os.path.exists(metrics_file):
            with open(metrics_file) as f:
                metrics = json.load(f)
                version = metrics.get("model_version", "1.0.0")

        print(f"  ✓ Models loaded from {load_dir} (version {version})")

        return cls(
            preprocessor=preprocessor,
            feature_engineer=feature_engineer,
            iso_model=iso_model,
            xgb_model=xgb_model,
            feature_columns=feature_columns,
            model_version=version,
        )

    def predict(self, transaction: dict, history: Optional[list[dict]] = None) -> PredictionResult:
        """
        Run a single transaction through the full prediction pipeline.

        Args:
            transaction: Dictionary with transaction fields matching the
                        training schema (upi_id, amount, merchant_category, etc.)
            history: Optional list of historical transaction dictionaries for this user,
                     ordered from oldest to newest.

        Returns:
            PredictionResult with risk score, decision, and metadata.
        """
        tx_id = transaction.get("transaction_id", "UNKNOWN")

        # 1. Convert to DataFrame (single row)
        df_current = pd.DataFrame([transaction])

        if history and len(history) > 0:
            df_hist = pd.DataFrame(history)
            df_raw = pd.concat([df_hist, df_current], ignore_index=True)
        else:
            df_raw = df_current

        # 2. Preprocess (on the full sequence)
        df_processed_all = self.preprocessor.transform(df_raw)

        # 3. Feature engineering (pass df_raw for historical context!)
        df_features_all = self.feature_engineer.transform(df_processed_all, raw_df=df_raw)

        # Extract only the last row (the current transaction we want to predict)
        df_features = df_features_all.iloc[[-1]].copy()

        # 4. Ensure target column is not in features
        if "is_fraud" in df_features.columns:
            df_features = df_features.drop(columns=["is_fraud"])

        # 5. Isolation Forest anomaly score
        # Align features with training columns (minus anomaly_score which we'll add)
        feature_cols_no_anomaly = [c for c in self.feature_columns if c != "anomaly_score"]
        X = self._align_features(df_features, feature_cols_no_anomaly)

        anomaly_score = float(self.iso_model.decision_function(X)[0])
        is_anomaly = self.iso_model.predict(X)[0] == -1

        # 6. Add anomaly score as feature for XGBoost
        X_enriched = X.copy()
        X_enriched["anomaly_score"] = anomaly_score
        X_enriched = self._align_features(X_enriched, self.feature_columns)

        # 7. XGBoost prediction
        fraud_probability = float(self.xgb_model.predict_proba(X_enriched)[0, 1])
        confidence = float(max(
            self.xgb_model.predict_proba(X_enriched)[0]
        ))

        # 8. Risk score mapping (0–100)
        risk_score = self._compute_risk_score(anomaly_score, fraud_probability)

        # 9. Risk level
        risk_level = self._get_risk_level(risk_score)

        # 10. Decision
        prediction = "blocked" if risk_score >= self.block_threshold else "approved"

        return PredictionResult(
            transaction_id=tx_id,
            anomaly_score=anomaly_score,
            is_anomaly=is_anomaly,
            fraud_probability=fraud_probability,
            risk_score=risk_score,
            risk_level=risk_level,
            prediction=prediction,
            confidence=confidence,
            model_version=self.model_version,
        )

    def predict_batch(self, transactions: list[dict]) -> list[PredictionResult]:
        """Predict fraud for a batch of transactions."""
        return [self.predict(tx) for tx in transactions]

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _align_features(df: pd.DataFrame, expected_columns: list[str]) -> pd.DataFrame:
        """
        Ensure the DataFrame has exactly the expected columns in the right order.
        Missing columns are filled with 0; extra columns are dropped.
        """
        for col in expected_columns:
            if col not in df.columns:
                df[col] = 0
        return df[expected_columns]

    @staticmethod
    def _compute_risk_score(anomaly_score: float, fraud_probability: float) -> int:
        """
        Combine Isolation Forest anomaly score and XGBoost fraud probability
        into a single 0–100 risk score.

        Formula:
          - XGBoost probability contributes 70% (primary signal)
          - Isolation Forest contributes 30% (anomaly signal)
          - Anomaly score is inverted and normalized (lower IF score = more risky)
        """
        # XGBoost contribution (0-100 scale)
        xgb_component = fraud_probability * 100 * 0.70

        # Isolation Forest contribution
        # decision_function returns: positive = normal, negative = anomaly
        # Normalize to 0-1 range where 1 = most anomalous
        # Typical range is roughly [-0.5, 0.5]
        normalized_anomaly = max(0, min(1, (0.5 - anomaly_score)))
        if_component = normalized_anomaly * 100 * 0.30

        risk_score = int(round(xgb_component + if_component))
        return max(0, min(100, risk_score))

    @staticmethod
    def _get_risk_level(risk_score: int) -> str:
        """Map a 0–100 risk score to a categorical risk level."""
        if risk_score <= 30:
            return "safe"
        elif risk_score <= 60:
            return "medium"
        else:
            return "fraud"


# ---------------------------------------------------------------------------
# Standalone test
# ---------------------------------------------------------------------------

def main() -> None:
    """Test the prediction pipeline with a sample transaction."""
    print("=" * 60)
    print("PayGuard – Prediction Module Test")
    print("=" * 60)

    predictor = FraudPredictor.load()

    # Sample legitimate transaction
    legit_tx = {
        "transaction_id": "TXN_TEST_001",
        "user_id": "USR0001",
        "upi_id": "user0001@oksbi",
        "amount": 250.0,
        "merchant_category": "grocery",
        "merchant_id": "MER1234",
        "location_city": "Mumbai",
        "location_lat": 19.076,
        "location_lng": 72.877,
        "timestamp": "2026-06-15 14:30:00",
        "payment_type": "p2m",
        "device_type": "android",
        "ip_address": "103.45.67.89",
        "os_type": "android_14",
        "bank_name": "SBI",
    }

    # Sample suspicious transaction
    fraud_tx = {
        "transaction_id": "TXN_TEST_002",
        "user_id": "USR0002",
        "upi_id": "pay0002@ybl",
        "amount": 49999.0,
        "merchant_category": "jewellery",
        "merchant_id": "MER9999",
        "location_city": "Delhi",
        "location_lat": 32.0,  # way off from Delhi
        "location_lng": 85.0,
        "timestamp": "2026-06-15 02:30:00",  # late night
        "payment_type": "p2m",
        "device_type": "web",
        "ip_address": "203.100.200.50",
        "os_type": "windows",
        "bank_name": "Yes_Bank",
    }

    for label, tx in [("Legitimate", legit_tx), ("Suspicious", fraud_tx)]:
        print(f"\n  Testing {label} transaction:")
        result = predictor.predict(tx)
        print(f"    Risk Score     : {result.risk_score}/100 ({result.risk_level})")
        print(f"    Fraud Prob     : {result.fraud_probability:.4f}")
        print(f"    Anomaly Score  : {result.anomaly_score:.4f}")
        print(f"    Is Anomaly     : {result.is_anomaly}")
        print(f"    Decision       : {result.prediction.upper()}")
        print(f"    Confidence     : {result.confidence:.4f}")


if __name__ == "__main__":
    main()
