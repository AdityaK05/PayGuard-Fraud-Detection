"""
PayGuard Backend – Transaction Service
========================================
Core business logic: creates transactions, runs ML predictions,
stores results, and generates dashboard data.
"""

import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional


from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.models import Alert, Log, Prediction, RiskScore, Transaction, User

settings = get_settings()

# Add ML scripts to path for model loading
_ml_scripts_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "scripts")
)
if _ml_scripts_dir not in sys.path:
    sys.path.insert(0, _ml_scripts_dir)


class TransactionService:
    """Handles transaction processing and ML prediction orchestration."""

    _predictor = None  # Singleton predictor instance
    _explainer = None  # Singleton SHAP explainer

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @classmethod
    def _get_predictor(cls):
        """Lazy-load the ML predictor (singleton)."""
        if cls._predictor is None:
            try:
                # Import ML classes into the current namespace
                from preprocessing import DataPreprocessor  # type: ignore
                from feature_engineering import FeatureEngineer  # type: ignore

                # CRITICAL FIX: Patch __main__ so joblib can deserialize
                # Preprocessor.pkl which was pickled from __main__ context
                import __main__
                __main__.DataPreprocessor = DataPreprocessor
                __main__.FeatureEngineer = FeatureEngineer

                from predict import FraudPredictor  # type: ignore
                models_dir = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models")
                )
                cls._predictor = FraudPredictor.load(models_dir)
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"  ⚠ ML models not loaded: {e}")
                cls._predictor = None
        return cls._predictor

    @classmethod
    def _get_explainer(cls):
        """Lazy-load the SHAP explainer (singleton)."""
        if cls._explainer is None:
            try:
                from explain import SHAPExplainer  # type: ignore
                models_dir = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models")
                )
                cls._explainer = SHAPExplainer.load(models_dir)
            except Exception as e:
                print(f"  [WARNING] SHAP explainer not loaded: {e}")
                cls._explainer = None
        return cls._explainer

    async def create_and_predict(
        self,
        user: User,
        data: dict,
    ) -> dict[str, Any]:
        """
        Full transaction pipeline:
          1. Create transaction record
          2. Run ML prediction
          3. Store prediction + risk score
          4. Generate alerts if needed
          5. Log the action
          6. Return result

        Returns:
            Dictionary with transaction and prediction details.
        """
        tx_id = f"TXN{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc)

        # 1. Create transaction record
        transaction = Transaction(
            user_id=user.id,
            transaction_id=tx_id,
            payment_type=data["payment_type"],
            amount=data["amount"],
            merchant_category=data["merchant_category"],
            merchant_id=data["merchant_id"],
            location_city=data["location_city"],
            location_lat=data["location_lat"],
            location_lng=data["location_lng"],
            device_type=data["device_type"],
            ip_address=data["ip_address"],
            os_type=data["os_type"],
            bank_name=data["bank_name"],
            status="pending",
        )
        self.db.add(transaction)
        await self.db.flush()

        # 2. Run ML prediction
        predictor = self._get_predictor()
        shap_data = None

        if predictor is not None:
            tx_data = {
                "transaction_id": tx_id,
                "timestamp": data.get("timestamp") or now.isoformat(),
            }
            for k, v in data.items():
                if isinstance(v, str) and k != "timestamp":
                    tx_data[k] = v.lower()
                else:
                    tx_data[k] = v
            
            # Fetch user history (last 50 transactions to build context)
            history_result = await self.db.execute(
                select(Transaction)
                .where(Transaction.user_id == user.id)
                .order_by(Transaction.timestamp.asc())
                .limit(50)
            )
            history_txs = history_result.scalars().all()
            
            history_data = []
            for tx in history_txs:
                history_data.append({
                    "transaction_id": tx.transaction_id,
                    "payment_type": tx.payment_type,
                    "amount": tx.amount,
                    "merchant_category": tx.merchant_category,
                    "merchant_id": tx.merchant_id,
                    "location_city": tx.location_city,
                    "location_lat": tx.location_lat,
                    "location_lng": tx.location_lng,
                    "device_type": tx.device_type,
                    "ip_address": tx.ip_address,
                    "os_type": tx.os_type,
                    "bank_name": tx.bank_name,
                    "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
                })

            result = predictor.predict(tx_data, history=history_data)

            # Get SHAP explanation
            explainer = self._get_explainer()
            if explainer is not None:
                try:
                    import pandas as pd
                    # Build feature vector for explanation
                    preprocessor = predictor.preprocessor
                    fe = predictor.feature_engineer
                    
                    df_current = pd.DataFrame([tx_data])
                    if history_data:
                        df_hist = pd.DataFrame(history_data)
                        df_raw = pd.concat([df_hist, df_current], ignore_index=True)
                    else:
                        df_raw = df_current
                        
                    df_processed_all = preprocessor.transform(df_raw)
                    df_features_all = fe.transform(df_processed_all, raw_df=df_raw)
                    df_features = df_features_all.iloc[[-1]].copy()
                    
                    if "is_fraud" in df_features.columns:
                        df_features = df_features.drop(columns=["is_fraud"])

                    # Add anomaly score
                    cols_no_anomaly = [c for c in predictor.feature_columns if c != "anomaly_score"]
                    X = df_features.copy()
                    for col in cols_no_anomaly:
                        if col not in X.columns:
                            X[col] = 0
                    X = X[cols_no_anomaly]
                    X["anomaly_score"] = predictor.iso_model.decision_function(X)
                    for col in predictor.feature_columns:
                        if col not in X.columns:
                            X[col] = 0
                    X = X[predictor.feature_columns]

                    shap_data = explainer.explain_prediction(X)
                except Exception as e:
                    print(f"  ⚠ SHAP explanation failed: {e}")
        else:
            # Fallback when models not loaded: generate random scores for demo
            import random
            result_dict = {
                "anomaly_score": round(random.uniform(-0.5, 0.5), 4),
                "is_anomaly": random.random() < 0.1,
                "fraud_probability": round(random.uniform(0, 0.3), 4),
                "risk_score": random.randint(5, 35),
                "risk_level": "safe",
                "prediction": "approved",
                "confidence": round(random.uniform(0.7, 0.99), 4),
                "model_version": "demo",
            }
            # Use a simple dataclass-like dict
            class _Result:
                pass
            result = _Result()
            for k, v in result_dict.items():
                setattr(result, k, v)

        # 3. Store prediction
        prediction = Prediction(
            transaction_id=transaction.id,
            anomaly_score=result.anomaly_score,
            is_anomaly=result.is_anomaly,
            fraud_probability=result.fraud_probability,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            prediction=result.prediction,
            confidence=result.confidence,
            model_version=result.model_version,
            shap_explanation=shap_data,
        )
        self.db.add(prediction)
        await self.db.flush()

        # 4. Store risk score
        risk_record = RiskScore(
            prediction_id=prediction.id,
            score=result.risk_score,
            risk_level=result.risk_level,
            threshold_applied=settings.FRAUD_BLOCK_THRESHOLD,
        )
        self.db.add(risk_record)

        # 5. Update transaction status
        transaction.status = result.prediction
        self.db.add(transaction)

        # 6. Create alert if fraud detected
        if result.risk_level == "fraud":
            alert = Alert(
                user_id=user.id,
                transaction_id=transaction.id,
                alert_type="fraud_detected",
                message=(
                    f"🚨 High-risk transaction detected! "
                    f"Amount: ₹{data['amount']:,.2f} | "
                    f"Risk Score: {result.risk_score}/100 | "
                    f"Status: BLOCKED"
                ),
            )
            self.db.add(alert)
        elif result.risk_level == "medium":
            alert = Alert(
                user_id=user.id,
                transaction_id=transaction.id,
                alert_type="suspicious",
                message=(
                    f"⚠️ Suspicious transaction flagged. "
                    f"Amount: ₹{data['amount']:,.2f} | "
                    f"Risk Score: {result.risk_score}/100"
                ),
            )
            self.db.add(alert)

        # 7. Log
        log = Log(
            action="prediction",
            user_id=user.id,
            details=json.dumps({
                "transaction_id": tx_id,
                "risk_score": result.risk_score,
                "prediction": result.prediction,
            }),
        )
        self.db.add(log)

        return {
            "transaction_id": tx_id,
            "anomaly_score": result.anomaly_score,
            "is_anomaly": result.is_anomaly,
            "fraud_probability": result.fraud_probability,
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "prediction": result.prediction,
            "confidence": result.confidence,
            "model_version": result.model_version,
            "shap_explanation": shap_data,
            "timestamp": now,
        }

    async def get_user_transactions(
        self,
        user_id: int,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Get paginated transaction history for a user."""
        offset = (page - 1) * per_page

        # Total count
        count_result = await self.db.execute(
            select(func.count()).select_from(Transaction).where(
                Transaction.user_id == user_id
            )
        )
        total = count_result.scalar() or 0

        # Fetch transactions with predictions
        result = await self.db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.timestamp.desc())
            .offset(offset)
            .limit(per_page)
        )
        transactions = result.scalars().all()

        items = []
        for tx in transactions:
            tx_dict = {
                "id": tx.id,
                "transaction_id": tx.transaction_id,
                "type": tx.payment_type,
                "amount": tx.amount,
                "nameOrig": "Self",
                "nameDest": f"{tx.bank_name} ({tx.merchant_id})",
                "status": tx.status,
                "timestamp": tx.timestamp,
                "risk_score": tx.prediction.risk_score if tx.prediction else None,
                "risk_level": tx.prediction.risk_level if tx.prediction else None,
            }
            items.append(tx_dict)

        return {
            "transactions": items,
            "total": total,
            "page": page,
            "per_page": per_page,
        }

    async def get_dashboard_stats(self, user_id: int) -> dict:
        """Generate dashboard statistics for a user."""
        # Total transactions
        total_result = await self.db.execute(
            select(func.count()).select_from(Transaction).where(
                Transaction.user_id == user_id
            )
        )
        total = total_result.scalar() or 0

        # Fraud count
        fraud_result = await self.db.execute(
            select(func.count()).select_from(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.status == "blocked",
            )
        )
        total_fraud = fraud_result.scalar() or 0

        # Approved count
        approved_result = await self.db.execute(
            select(func.count()).select_from(Transaction).where(
                Transaction.user_id == user_id,
                Transaction.status == "approved",
            )
        )
        total_approved = approved_result.scalar() or 0

        # Average risk score
        avg_result = await self.db.execute(
            select(func.avg(Prediction.risk_score))
            .join(Transaction)
            .where(Transaction.user_id == user_id)
        )
        avg_risk = avg_result.scalar() or 0.0

        # Recent alerts
        alerts_result = await self.db.execute(
            select(Alert)
            .where(Alert.user_id == user_id)
            .order_by(Alert.created_at.desc())
            .limit(5)
        )
        recent_alerts = [
            {
                "id": a.id,
                "type": a.alert_type,
                "message": a.message,
                "is_read": a.is_read,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts_result.scalars().all()
        ]

        # Risk distribution
        risk_dist = {"safe": 0, "medium": 0, "fraud": 0}
        dist_result = await self.db.execute(
            select(Prediction.risk_level, func.count())
            .join(Transaction)
            .where(Transaction.user_id == user_id)
            .group_by(Prediction.risk_level)
        )
        for level, count in dist_result.all():
            if level in risk_dist:
                risk_dist[level] = count

        # Model metrics from file
        model_metrics = self._load_model_metrics()

        return {
            "total_transactions": total,
            "total_fraud": total_fraud,
            "total_approved": total_approved,
            "total_blocked": total_fraud,
            "fraud_rate": round(total_fraud / max(total, 1), 4),
            "avg_risk_score": round(float(avg_risk), 2),
            "recent_alerts": recent_alerts,
            "daily_transactions": [],  # Populated by frontend with historical data
            "risk_distribution": risk_dist,
            "model_metrics": model_metrics,
        }

    @staticmethod
    def _load_model_metrics() -> dict:
        """Load training metrics from the ML models directory."""
        metrics_file = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__), "..", "..", "..", "ml", "models", "training_metrics.json"
            )
        )
        try:
            with open(metrics_file) as f:
                data = json.load(f)
                return {
                    "accuracy": data.get("accuracy", 0),
                    "precision": data.get("precision", 0),
                    "recall": data.get("recall", 0),
                    "f1_score": data.get("f1_score", 0),
                    "roc_auc": data.get("roc_auc", 0),
                }
        except FileNotFoundError:
            return {"accuracy": 0, "precision": 0, "recall": 0, "f1_score": 0, "roc_auc": 0}
