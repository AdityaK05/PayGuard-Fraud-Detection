"""
PayGuard – Model Training Pipeline
====================================
Trains the hybrid fraud detection pipeline:

  1. Load preprocessed + feature-engineered data
  2. Split into train/test sets (stratified)
  3. Apply SMOTE to balance the training set
  4. Train Isolation Forest → generate anomaly scores → append as feature
  5. Train XGBoost classifier on the enriched feature set
  6. Evaluate and log metrics
  7. Save all model artifacts

Artifacts saved:
  - ml/models/IsolationForest.pkl
  - ml/models/XGBoost.pkl
  - ml/models/feature_columns.pkl   (ordered feature list for inference)
  - ml/models/training_metrics.json

Design note:
  SMOTE is applied ONLY to training data. The test set and all future
  inference data remain unmodified to ensure honest evaluation.
"""

import json
import os
import sys
import warnings
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

# Add parent to path for local imports
sys.path.insert(0, os.path.dirname(__file__))

from preprocessing import DataPreprocessor
from feature_engineering import FeatureEngineer

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets")

# ---------------------------------------------------------------------------
# Hyperparameters
# ---------------------------------------------------------------------------
ISOLATION_FOREST_PARAMS = {
    "n_estimators": 200,
    "contamination": 0.05,
    "max_samples": "auto",
    "random_state": 42,
    "n_jobs": -1,
}

XGBOOST_PARAMS = {
    "n_estimators": 300,
    "max_depth": 6,
    "learning_rate": 0.1,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "reg_alpha": 0.1,
    "reg_lambda": 1.0,
    "use_label_encoder": False,
    "eval_metric": "logloss",
    "random_state": 42,
    "n_jobs": -1,
}

SMOTE_PARAMS = {
    "sampling_strategy": 0.5,  # fraud:legit = 1:2
    "random_state": 42,
    "k_neighbors": 5,
}

TEST_SIZE = 0.2
RANDOM_STATE = 42


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load raw dataset, run preprocessing and feature engineering.

    Returns:
        Tuple of (feature-engineered DataFrame, raw DataFrame).
    """
    raw_file = os.path.join(DATASETS_DIR, "upi_transactions.csv")
    if not os.path.exists(raw_file):
        raise FileNotFoundError(
            f"Dataset not found at {raw_file}. Run generate_dataset.py first."
        )

    df_raw = pd.read_csv(raw_file)
    print(f"  Raw dataset loaded: {df_raw.shape}")

    # Preprocess
    preprocessor = DataPreprocessor()
    df_processed = preprocessor.fit_transform(df_raw)
    preprocessor.save(MODELS_DIR)
    print(f"  After preprocessing: {df_processed.shape}")

    # Feature engineering
    fe = FeatureEngineer()
    df_features = fe.transform(df_processed, raw_df=df_raw)
    print(f"  After feature engineering: {df_features.shape}")

    return df_features, df_raw


def train_isolation_forest(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
) -> tuple[IsolationForest, np.ndarray, np.ndarray]:
    """
    Train the Isolation Forest anomaly detector and compute anomaly scores.

    The anomaly score from decision_function() is appended as a new feature
    for the downstream XGBoost classifier.

    Returns:
        Tuple of (fitted model, train anomaly scores, test anomaly scores).
    """
    print("\n  Training Isolation Forest...")
    iso_model = IsolationForest(**ISOLATION_FOREST_PARAMS)
    iso_model.fit(X_train)

    # decision_function: lower → more anomalous
    train_scores = iso_model.decision_function(X_train)
    test_scores = iso_model.decision_function(X_test)

    # Also get binary predictions for analysis
    train_preds = iso_model.predict(X_train)
    anomalies_found = (train_preds == -1).sum()
    print(f"  ✓ Isolation Forest trained ({ISOLATION_FOREST_PARAMS['n_estimators']} trees)")
    print(f"    Anomalies detected in train: {anomalies_found} "
          f"({anomalies_found / len(X_train):.2%})")

    return iso_model, train_scores, test_scores


def apply_smote(
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> tuple[pd.DataFrame, pd.Series]:
    """
    Apply SMOTE to balance the training set.

    CRITICAL: SMOTE is applied ONLY during training. Never during prediction.
    """
    print("\n  Applying SMOTE for class balance...")
    before_counts = y_train.value_counts().to_dict()
    print(f"    Before SMOTE: {before_counts}")

    smote = SMOTE(**SMOTE_PARAMS)
    X_resampled, y_resampled = smote.fit_resample(X_train, y_train)

    after_counts = pd.Series(y_resampled).value_counts().to_dict()
    print(f"    After SMOTE:  {after_counts}")

    return pd.DataFrame(X_resampled, columns=X_train.columns), pd.Series(y_resampled)


def train_xgboost(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> tuple[XGBClassifier, dict]:
    """
    Train the XGBoost classifier on the SMOTE-balanced, anomaly-enriched
    feature set.

    Returns:
        Tuple of (fitted model, metrics dictionary).
    """
    print("\n  Training XGBoost classifier...")

    # Calculate scale_pos_weight as additional class balance aid
    n_neg = (y_train == 0).sum()
    n_pos = (y_train == 1).sum()
    scale_weight = n_neg / max(n_pos, 1)

    params = {**XGBOOST_PARAMS, "scale_pos_weight": scale_weight}
    xgb_model = XGBClassifier(**params)

    xgb_model.fit(
        X_train,
        y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # Predictions
    y_pred = xgb_model.predict(X_test)
    y_prob = xgb_model.predict_proba(X_test)[:, 1]

    # Metrics
    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1_score": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, y_prob), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }

    print(f"  ✓ XGBoost trained ({XGBOOST_PARAMS['n_estimators']} rounds)")
    print(f"\n  {'─' * 40}")
    print(f"  Model Performance on Test Set:")
    print(f"  {'─' * 40}")
    print(f"  Accuracy  : {metrics['accuracy']:.4f}")
    print(f"  Precision : {metrics['precision']:.4f}")
    print(f"  Recall    : {metrics['recall']:.4f}")
    print(f"  F1 Score  : {metrics['f1_score']:.4f}")
    print(f"  ROC AUC   : {metrics['roc_auc']:.4f}")
    print(f"  {'─' * 40}")
    print(f"\n  Confusion Matrix:")
    print(f"  {metrics['confusion_matrix']}")
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legitimate", "Fraud"]))

    return xgb_model, metrics


def save_artifacts(
    iso_model: IsolationForest,
    xgb_model: XGBClassifier,
    feature_columns: list[str],
    metrics: dict,
) -> None:
    """Save all trained model artifacts to disk."""
    os.makedirs(MODELS_DIR, exist_ok=True)

    joblib.dump(iso_model, os.path.join(MODELS_DIR, "IsolationForest.pkl"))
    joblib.dump(xgb_model, os.path.join(MODELS_DIR, "XGBoost.pkl"))
    joblib.dump(feature_columns, os.path.join(MODELS_DIR, "feature_columns.pkl"))

    # Add metadata
    metrics["model_version"] = "1.0.0"
    metrics["trained_at"] = datetime.now().isoformat()
    metrics["num_features"] = len(feature_columns)
    metrics["feature_columns"] = feature_columns

    with open(os.path.join(MODELS_DIR, "training_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n  ✓ IsolationForest.pkl saved  → {MODELS_DIR}")
    print(f"  ✓ XGBoost.pkl saved          → {MODELS_DIR}")
    print(f"  ✓ feature_columns.pkl saved   → {MODELS_DIR}")
    print(f"  ✓ training_metrics.json saved → {MODELS_DIR}")


def main() -> None:
    """Execute the full training pipeline."""
    print("=" * 60)
    print("PayGuard – Model Training Pipeline")
    print("=" * 60)

    # 1. Load and prepare data
    df, _ = load_data()

    # 2. Separate features and target
    target_col = "is_fraud"
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in dataset.")

    X = df.drop(columns=[target_col])
    y = df[target_col]

    print(f"\n  Features: {X.shape[1]} columns")
    print(f"  Target distribution: {y.value_counts().to_dict()}")

    # 3. Train/test split (stratified to preserve fraud ratio)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    print(f"\n  Train set: {X_train.shape[0]} rows")
    print(f"  Test set:  {X_test.shape[0]} rows")

    # 4. Train Isolation Forest and generate anomaly scores
    iso_model, train_anomaly_scores, test_anomaly_scores = train_isolation_forest(
        X_train, X_test
    )

    # 5. Append anomaly scores as a feature
    X_train = X_train.copy()
    X_test = X_test.copy()
    X_train["anomaly_score"] = train_anomaly_scores
    X_test["anomaly_score"] = test_anomaly_scores

    # 6. Apply SMOTE (training data only)
    X_train_balanced, y_train_balanced = apply_smote(X_train, y_train)

    # 7. Train XGBoost
    xgb_model, metrics = train_xgboost(
        X_train_balanced, y_train_balanced,
        X_test, y_test,
    )

    # 8. Save everything
    feature_columns = list(X_train.columns)
    save_artifacts(iso_model, xgb_model, feature_columns, metrics)

    print("\n" + "=" * 60)
    print("Training complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
