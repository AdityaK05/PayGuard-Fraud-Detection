"""
PayGuard ML – Real-Time Prediction Module
"""

import os
import joblib
import pandas as pd
from typing import Optional
from dataclasses import dataclass
import sys

sys.path.insert(0, os.path.dirname(__file__))
from preprocessing import DataPreprocessor
from feature_engineering import FeatureEngineer

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
DEFAULT_BLOCK_THRESHOLD = 70

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
        
        xgb_component = fraud_probability * 100 * 0.70
        normalized_anomaly = max(0, min(1, (0.5 - anomaly_score)))
        if_component = normalized_anomaly * 100 * 0.30
        risk_score = max(0, min(100, int(round(xgb_component + if_component))))
        
        risk_level = "safe" if risk_score <= 30 else "medium" if risk_score <= 60 else "fraud"
        prediction = "blocked" if risk_score >= self.block_threshold else "approved"
        
        return PredictionResult(
            transaction_id=tx_id, anomaly_score=anomaly_score, is_anomaly=is_anomaly,
            fraud_probability=fraud_probability, risk_score=risk_score, risk_level=risk_level,
            prediction=prediction, confidence=confidence, model_version=self.model_version
        )
