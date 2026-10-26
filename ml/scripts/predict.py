"""
PayGuard ML – Real-Time Prediction Module
"""

import os
import math
import joblib
import pandas as pd
from typing import Optional
from dataclasses import dataclass
import sys

sys.path.insert(0, os.path.dirname(__file__))
from preprocessing import DataPreprocessor
from feature_engineering import FeatureEngineer

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
DEFAULT_BLOCK_THRESHOLD = 50

@dataclass
class PredictionResult:
    transaction_id: str
    anomaly_score: float
    is_anomaly: bool
    fraud_probability: float
    risk_score: int
    risk_level: str
    prediction: str
    confidence: float
    model_version: str
    feature_contributions: Optional[dict] = None

class FraudPredictor:
    def __init__(self, preprocessor, feature_engineer, iso_model, xgb_model, feature_columns, model_version="2.0.0", block_threshold=DEFAULT_BLOCK_THRESHOLD):
        self.preprocessor = preprocessor
        self.feature_engineer = feature_engineer
        self.iso_model = iso_model
        self.xgb_model = xgb_model
        self.feature_columns = feature_columns
        self.model_version = model_version
        self.block_threshold = block_threshold

    @classmethod
    def load(cls, models_dir: Optional[str] = None) -> "FraudPredictor":
        load_dir = models_dir or MODELS_DIR
        preprocessor = DataPreprocessor.load(load_dir)
        feature_engineer = FeatureEngineer()
        iso_model = joblib.load(os.path.join(load_dir, "IsolationForest.pkl"))
        xgb_model = joblib.load(os.path.join(load_dir, "XGBoost.pkl"))
        feature_columns = joblib.load(os.path.join(load_dir, "feature_columns.pkl"))
        
        return cls(preprocessor, feature_engineer, iso_model, xgb_model, feature_columns)

    def predict(self, transaction: dict, history: Optional[list[dict]] = None) -> PredictionResult:
        tx_id = transaction.get("transaction_id", "UNKNOWN")
        
        df_current = pd.DataFrame([transaction])
        
        if history and len(history) > 0:
            df_hist = pd.DataFrame(history)
            df_raw = pd.concat([df_hist, df_current], ignore_index=True)
        else:
            df_raw = df_current
            
        df_processed_all = self.preprocessor.transform(df_raw)
        df_features_all = self.feature_engineer.transform(df_processed_all, raw_df=df_raw)
        
        df_features = df_features_all.iloc[[-1]].copy()
        
        for col in ["is_fraud", "transaction_id", "user_id", "upi_id", "timestamp", "ip_address", "merchant_id"]:
            if col in df_features.columns:
                df_features = df_features.drop(columns=[col])
                
        feature_cols_no_anomaly = [c for c in self.feature_columns if c != "anomaly_score"]
        X = df_features.copy()
        for col in feature_cols_no_anomaly:
            if col not in X.columns:
                X[col] = 0
        X = X[feature_cols_no_anomaly]
        
        anomaly_score = float(self.iso_model.decision_function(X)[0])
        is_anomaly = self.iso_model.predict(X)[0] == -1
        
        X_enriched = X.copy()
        X_enriched["anomaly_score"] = anomaly_score
        for col in self.feature_columns:
            if col not in X_enriched.columns:
                X_enriched[col] = 0
        X_enriched = X_enriched[self.feature_columns]
        
        fraud_probability = float(self.xgb_model.predict_proba(X_enriched)[0, 1])
        confidence = float(max(self.xgb_model.predict_proba(X_enriched)[0]))
        
        # Multi-factor calibrated continuous risk score (0 - 100)
        # 1. Base probability mapping
        if fraud_probability < 0.20:
            # Safe zone: maps base from 2% to 14%
            base_risk = 2.0 + (fraud_probability / 0.20) * 12.0
        elif fraud_probability < 0.50:
            # Review zone: maps base from 25% to 48%
            base_risk = 25.0 + ((fraud_probability - 0.20) / 0.30) * 23.0
        else:
            # Fraud zone: maps base from 58% to 92%
            base_risk = 58.0 + ((fraud_probability - 0.50) / 0.50) * 34.0

        # 2. Continuous anomaly factor from Isolation Forest
        if anomaly_score < 0:
            anom_factor = min(20.0, abs(anomaly_score) * 150.0)
        else:
            # Routine typical transactions receive small healthy risk relief
            anom_factor = -min(2.5, anomaly_score * 15.0)

        # 3. Transaction magnitude & category ratio nuance
        amt = float(transaction.get("amount", 500) or 500)
        amt_factor = min(6.0, max(0.0, (math.log10(max(10.0, amt)) - 1.5) * 2.0))

        cat_ratio = float(df_features_all["amount_vs_category_avg"].iloc[-1]) if "amount_vs_category_avg" in df_features_all.columns else 1.0
        cat_factor = min(5.0, max(0.0, (cat_ratio - 1.0) * 1.5))

        # 4. Temporal factor (late night 23:00 - 04:00)
        is_late = int(df_features_all["is_late_night"].iloc[-1]) if "is_late_night" in df_features_all.columns else 0
        hour_factor = 4.0 if is_late else 0.0

        # 5. Geolocation / untrusted IP factor
        city_str = str(transaction.get("location_city", "")).lower()
        is_foreign = ("dubai" in city_str or "foreign" in city_str or "unknown" in city_str or "russia" in city_str or "moscow" in city_str)
        geo_factor = 6.0 if is_foreign else 0.0

        # Combined composite risk
        composite = base_risk + anom_factor + amt_factor + cat_factor + hour_factor + geo_factor

        # Strict tier bounds to avoid false classifications
        if fraud_probability < 0.05:
            # Definitely safe tier (2% - 22% realistic continuous variation)
            risk_score = int(round(min(22.0, max(2.0, composite))))
        elif fraud_probability < 0.25:
            # Low-to-moderate tier (8% - 38%)
            risk_score = int(round(min(38.0, max(8.0, composite))))
        elif fraud_probability < 0.50:
            # Borderline / review tier (25% - 49%)
            risk_score = int(round(min(49.0, max(25.0, composite))))
        else:
            # Blocked / fraud tier (55% - 99% realistic continuous variation)
            risk_score = int(round(min(99.0, max(55.0, composite))))

        if risk_score >= self.block_threshold or fraud_probability >= 0.50:
            risk_level = "fraud"
            prediction = "blocked"
        elif risk_score >= 25 or fraud_probability >= 0.25:
            risk_level = "medium"
            prediction = "review"
        else:
            risk_level = "safe"
            prediction = "approved"
        
        return PredictionResult(
            transaction_id=tx_id, anomaly_score=anomaly_score, is_anomaly=is_anomaly,
            fraud_probability=fraud_probability, risk_score=risk_score, risk_level=risk_level,
            prediction=prediction, confidence=confidence, model_version=self.model_version
        )
