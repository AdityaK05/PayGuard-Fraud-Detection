"""
PayGuard – Model Evaluation Module
====================================
Generates comprehensive evaluation artifacts for the trained model:

  - Confusion Matrix heatmap
  - ROC Curve with AUC
  - Precision-Recall Curve
  - Feature Importance bar chart (XGBoost built-in)
  - Metrics summary table

All plots are saved to: ml/models/evaluation/
"""

import json
import os
import sys
import warnings

import joblib
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    auc,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split

matplotlib.use("Agg")
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(__file__))

from preprocessing import DataPreprocessor
from feature_engineering import FeatureEngineer

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
EVAL_DIR = os.path.join(MODELS_DIR, "evaluation")
DATASETS_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets")

# Consistent style
plt.style.use("dark_background")
ACCENT_COLOR = "#3b82f6"
DANGER_COLOR = "#ef4444"
SUCCESS_COLOR = "#22c55e"
BG_COLOR = "#0a0e1a"
CARD_COLOR = "#111827"


def load_test_data() -> tuple[pd.DataFrame, pd.Series]:
    """
    Reproduce the train/test split from training to get the test set.
    """
    raw_file = os.path.join(DATASETS_DIR, "upi_transactions.csv")
    df_raw = pd.read_csv(raw_file)

    preprocessor = DataPreprocessor.load(MODELS_DIR)
    df_processed = preprocessor.transform(df_raw)

    fe = FeatureEngineer()
    df_features = fe.transform(df_processed, raw_df=df_raw)

    X = df_features.drop(columns=["is_fraud"])
    y = df_features["is_fraud"]

    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Add anomaly score feature
    iso_model = joblib.load(os.path.join(MODELS_DIR, "IsolationForest.pkl"))
    feature_columns = joblib.load(os.path.join(MODELS_DIR, "feature_columns.pkl"))

    cols_no_anomaly = [c for c in feature_columns if c != "anomaly_score"]
    X_test_aligned = X_test.copy()
    for col in cols_no_anomaly:
        if col not in X_test_aligned.columns:
            X_test_aligned[col] = 0
    X_test_aligned = X_test_aligned[cols_no_anomaly]

    X_test_aligned["anomaly_score"] = iso_model.decision_function(X_test_aligned)

    # Final alignment
    for col in feature_columns:
        if col not in X_test_aligned.columns:
            X_test_aligned[col] = 0
    X_test_aligned = X_test_aligned[feature_columns]

    return X_test_aligned, y_test


def plot_confusion_matrix(y_true: np.ndarray, y_pred: np.ndarray) -> None:
    """Generate and save a styled confusion matrix heatmap."""
    cm = confusion_matrix(y_true, y_pred)

    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(CARD_COLOR)

    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Legitimate", "Fraud"],
        yticklabels=["Legitimate", "Fraud"],
        ax=ax,
        cbar_kws={"shrink": 0.8},
        annot_kws={"size": 16, "weight": "bold"},
    )
    ax.set_xlabel("Predicted Label", fontsize=12, color="white")
    ax.set_ylabel("True Label", fontsize=12, color="white")
    ax.set_title("Confusion Matrix", fontsize=14, color="white", pad=15)
    ax.tick_params(colors="white")

    plt.tight_layout()
    plt.savefig(
        os.path.join(EVAL_DIR, "confusion_matrix.png"),
        dpi=150,
        facecolor=BG_COLOR,
        bbox_inches="tight",
    )
    plt.close()
    print("  ✓ Confusion matrix saved")


def plot_roc_curve(y_true: np.ndarray, y_prob: np.ndarray) -> None:
    """Generate and save an ROC curve."""
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    roc_auc = auc(fpr, tpr)

    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(CARD_COLOR)

    ax.plot(fpr, tpr, color=ACCENT_COLOR, lw=2.5, label=f"ROC Curve (AUC = {roc_auc:.4f})")
    ax.plot([0, 1], [0, 1], color="#4b5563", lw=1, linestyle="--", label="Random Baseline")
    ax.fill_between(fpr, tpr, alpha=0.15, color=ACCENT_COLOR)

    ax.set_xlabel("False Positive Rate", fontsize=12, color="white")
    ax.set_ylabel("True Positive Rate", fontsize=12, color="white")
    ax.set_title("Receiver Operating Characteristic (ROC)", fontsize=14, color="white", pad=15)
    ax.legend(loc="lower right", fontsize=10, facecolor=CARD_COLOR, edgecolor="#374151")
    ax.tick_params(colors="white")
    ax.grid(True, alpha=0.1)

    plt.tight_layout()
    plt.savefig(
        os.path.join(EVAL_DIR, "roc_curve.png"),
        dpi=150,
        facecolor=BG_COLOR,
        bbox_inches="tight",
    )
    plt.close()
    print("  ✓ ROC curve saved")


def plot_precision_recall(y_true: np.ndarray, y_prob: np.ndarray) -> None:
    """Generate and save a Precision-Recall curve."""
    precision, recall, _ = precision_recall_curve(y_true, y_prob)
    pr_auc = auc(recall, precision)

    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(CARD_COLOR)

    ax.plot(recall, precision, color=SUCCESS_COLOR, lw=2.5,
            label=f"PR Curve (AUC = {pr_auc:.4f})")
    ax.fill_between(recall, precision, alpha=0.15, color=SUCCESS_COLOR)

    ax.set_xlabel("Recall", fontsize=12, color="white")
    ax.set_ylabel("Precision", fontsize=12, color="white")
    ax.set_title("Precision-Recall Curve", fontsize=14, color="white", pad=15)
    ax.legend(loc="upper right", fontsize=10, facecolor=CARD_COLOR, edgecolor="#374151")
    ax.tick_params(colors="white")
    ax.grid(True, alpha=0.1)

    plt.tight_layout()
    plt.savefig(
        os.path.join(EVAL_DIR, "precision_recall_curve.png"),
        dpi=150,
        facecolor=BG_COLOR,
        bbox_inches="tight",
    )
    plt.close()
    print("  ✓ Precision-Recall curve saved")


def plot_feature_importance(model, feature_columns: list[str]) -> None:
    """Generate and save a feature importance bar chart."""
    importance = model.feature_importances_
    sorted_idx = np.argsort(importance)[-15:]  # Top 15

    fig, ax = plt.subplots(figsize=(10, 8))
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(CARD_COLOR)

    colors = plt.cm.Blues(np.linspace(0.4, 1.0, len(sorted_idx)))
    bars = ax.barh(
        [feature_columns[i] for i in sorted_idx],
        importance[sorted_idx],
        color=colors,
        edgecolor="#1e3a5f",
        height=0.6,
    )

    ax.set_xlabel("Feature Importance (Gain)", fontsize=12, color="white")
    ax.set_title("Top 15 Feature Importances – XGBoost", fontsize=14, color="white", pad=15)
    ax.tick_params(colors="white")
    ax.grid(True, axis="x", alpha=0.1)

    # Add value labels
    for bar in bars:
        width = bar.get_width()
        ax.text(
            width + 0.002,
            bar.get_y() + bar.get_height() / 2,
            f"{width:.3f}",
            va="center",
            fontsize=9,
            color="white",
        )

    plt.tight_layout()
    plt.savefig(
        os.path.join(EVAL_DIR, "feature_importance.png"),
        dpi=150,
        facecolor=BG_COLOR,
        bbox_inches="tight",
    )
    plt.close()
    print("  ✓ Feature importance chart saved")


def main() -> None:
    """Run the full evaluation pipeline."""
    os.makedirs(EVAL_DIR, exist_ok=True)

    print("=" * 60)
    print("PayGuard – Model Evaluation")
    print("=" * 60)

    # Load test data
    print("\n  Loading test data...")
    X_test, y_test = load_test_data()

    # Load XGBoost model
    xgb_model = joblib.load(os.path.join(MODELS_DIR, "XGBoost.pkl"))
    feature_columns = joblib.load(os.path.join(MODELS_DIR, "feature_columns.pkl"))

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
    }

    print(f"\n  {'─' * 40}")
    print(f"  Evaluation Metrics:")
    print(f"  {'─' * 40}")
    for name, value in metrics.items():
        print(f"  {name:15s}: {value:.4f}")
    print(f"  {'─' * 40}")

    # Generate plots
    print("\n  Generating evaluation plots...")
    plot_confusion_matrix(y_test.values, y_pred)
    plot_roc_curve(y_test.values, y_prob)
    plot_precision_recall(y_test.values, y_prob)
    plot_feature_importance(xgb_model, feature_columns)

    # Save metrics as JSON
    with open(os.path.join(EVAL_DIR, "evaluation_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
    print("  ✓ Evaluation metrics saved")

    print(f"\n  All artifacts saved to: {EVAL_DIR}")
    print("\n" + "=" * 60)
    print("Evaluation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
