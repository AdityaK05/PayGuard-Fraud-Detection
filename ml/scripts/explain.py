"""
PayGuard – SHAP Explainability Module
=======================================
Provides model-agnostic explanations for individual fraud predictions
using SHAP (SHapley Additive exPlanations).

Features:
  - Global feature importance (SHAP summary plot)
  - Individual prediction explanations (waterfall / force plots)
  - Top contributing features per prediction
  - Serializable explanation data for API responses

References:
  Lundberg, S.M., Lee, S.I. (2017). "A Unified Approach to Interpreting
  Model Predictions." NeurIPS.
"""

import json
import os
import sys
import warnings
from typing import Optional

import joblib
import numpy as np
import pandas as pd
import shap

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(__file__))

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
EVAL_DIR = os.path.join(MODELS_DIR, "evaluation")

BG_COLOR = "#0a0e1a"


class SHAPExplainer:
    """
    Wraps SHAP's TreeExplainer for XGBoost to provide human-readable
    explanations of fraud predictions.
    """

    def __init__(self, xgb_model, feature_columns: list[str]) -> None:
        self.model = xgb_model
        self.feature_columns = feature_columns
        self.explainer = shap.TreeExplainer(xgb_model)

    @classmethod
    def load(cls, models_dir: Optional[str] = None) -> "SHAPExplainer":
        """Load XGBoost model and initialize the SHAP explainer."""
        load_dir = models_dir or MODELS_DIR
        xgb_model = joblib.load(os.path.join(load_dir, "XGBoost.pkl"))
        feature_columns = joblib.load(os.path.join(load_dir, "feature_columns.pkl"))
        return cls(xgb_model, feature_columns)

    def explain_prediction(
        self,
        X: pd.DataFrame,
        top_n: int = 5,
    ) -> dict:
        """
        Explain a single prediction.

        Args:
            X: Single-row DataFrame with model features.
            top_n: Number of top contributing features to return.

        Returns:
            Dictionary with:
              - base_value: Expected model output
              - shap_values: All SHAP values
              - top_features: Top N features sorted by absolute impact
              - prediction_explanation: Human-readable explanation string
        """
        X_aligned = X[self.feature_columns] if set(self.feature_columns).issubset(X.columns) else X

        shap_values = self.explainer.shap_values(X_aligned)

        # Handle multi-output (binary classification)
        if isinstance(shap_values, list):
            # Use SHAP values for the positive class (fraud)
            sv = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        else:
            sv = shap_values[0]

        base_value = self.explainer.expected_value
        if isinstance(base_value, (list, np.ndarray)):
            base_value = float(base_value[1] if len(base_value) > 1 else base_value[0])

        # Build feature contribution map
        contributions = {}
        for i, col in enumerate(self.feature_columns):
            if i < len(sv):
                contributions[col] = {
                    "shap_value": round(float(sv[i]), 4),
                    "feature_value": round(float(X_aligned.iloc[0, i]), 4),
                    "impact": "increases_risk" if sv[i] > 0 else "decreases_risk",
                }

        # Sort by absolute SHAP value
        sorted_features = sorted(
            contributions.items(),
            key=lambda x: abs(x[1]["shap_value"]),
            reverse=True,
        )

        top_features = dict(sorted_features[:top_n])

        # Human-readable explanation
        explanation_parts = []
        for fname, fdata in list(top_features.items())[:3]:
            direction = "increased" if fdata["impact"] == "increases_risk" else "decreased"
            explanation_parts.append(
                f"'{fname}' (value={fdata['feature_value']}) {direction} fraud risk"
            )
        explanation = "; ".join(explanation_parts)

        return {
            "base_value": round(float(base_value), 4),
            "top_features": top_features,
            "prediction_explanation": explanation,
            "all_shap_values": {
                self.feature_columns[i]: round(float(sv[i]), 4)
                for i in range(min(len(sv), len(self.feature_columns)))
            },
        }

    def generate_summary_plot(
        self,
        X: pd.DataFrame,
        output_dir: Optional[str] = None,
    ) -> str:
        """
        Generate a SHAP summary plot (beeswarm) for a dataset.

        Args:
            X: DataFrame with multiple rows.
            output_dir: Directory to save the plot.

        Returns:
            Path to the saved plot.
        """
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        plt.style.use("dark_background")
        
        save_dir = output_dir or EVAL_DIR
        os.makedirs(save_dir, exist_ok=True)

        X_aligned = X[self.feature_columns] if set(self.feature_columns).issubset(X.columns) else X

        shap_values = self.explainer.shap_values(X_aligned)
        if isinstance(shap_values, list) and len(shap_values) > 1:
            sv = shap_values[1]
        else:
            sv = shap_values

        fig, ax = plt.subplots(figsize=(12, 8))
        fig.patch.set_facecolor(BG_COLOR)

        shap.summary_plot(
            sv,
            X_aligned,
            feature_names=self.feature_columns,
            show=False,
            max_display=15,
        )

        plt.title("SHAP Feature Impact Summary", fontsize=14, color="white", pad=15)
        plt.tight_layout()

        output_path = os.path.join(save_dir, "shap_summary.png")
        plt.savefig(output_path, dpi=150, facecolor=BG_COLOR, bbox_inches="tight")
        plt.close()

        print(f"  ✓ SHAP summary plot saved → {output_path}")
        return output_path


# ---------------------------------------------------------------------------
# Standalone execution
# ---------------------------------------------------------------------------

def main() -> None:
    """Generate SHAP plots and test individual explanation."""
    from preprocessing import DataPreprocessor
    from feature_engineering import FeatureEngineer

    print("=" * 60)
    print("PayGuard – SHAP Explainability")
    print("=" * 60)

    os.makedirs(EVAL_DIR, exist_ok=True)

    # Load test data
    datasets_dir = os.path.join(os.path.dirname(__file__), "..", "datasets")
    raw_file = os.path.join(datasets_dir, "upi_transactions.csv")

    if not os.path.exists(raw_file):
        print("✗ Dataset not found. Run generate_dataset.py first.")
        return

    df_raw = pd.read_csv(raw_file)
    preprocessor = DataPreprocessor.load(MODELS_DIR)
    df_processed = preprocessor.transform(df_raw)

    fe = FeatureEngineer()
    df_features = fe.transform(df_processed, raw_df=df_raw)

    if "is_fraud" in df_features.columns:
        df_features = df_features.drop(columns=["is_fraud"])

    # Add anomaly score
    iso_model = joblib.load(os.path.join(MODELS_DIR, "IsolationForest.pkl"))
    feature_columns = joblib.load(os.path.join(MODELS_DIR, "feature_columns.pkl"))

    cols_no_anomaly = [c for c in feature_columns if c != "anomaly_score"]
    X = df_features.copy()
    for col in cols_no_anomaly:
        if col not in X.columns:
            X[col] = 0
    X = X[cols_no_anomaly]
    X["anomaly_score"] = iso_model.decision_function(X)
    for col in feature_columns:
        if col not in X.columns:
            X[col] = 0
    X = X[feature_columns]

    # Initialize explainer
    explainer = SHAPExplainer.load()

    # Generate summary plot (use subset for speed)
    print("\n  Generating SHAP summary plot (sampling 500 rows)...")
    X_sample = X.sample(min(500, len(X)), random_state=42)
    explainer.generate_summary_plot(X_sample)

    # Explain a single prediction
    print("\n  Explaining single prediction:")
    single = X.iloc[[0]]
    explanation = explainer.explain_prediction(single)
    print(f"    Base value: {explanation['base_value']}")
    print(f"    Explanation: {explanation['prediction_explanation']}")
    print(f"    Top features:")
    for fname, fdata in explanation["top_features"].items():
        print(f"      {fname}: SHAP={fdata['shap_value']}, value={fdata['feature_value']}")

    # Save sample explanation as JSON
    with open(os.path.join(EVAL_DIR, "sample_explanation.json"), "w") as f:
        json.dump(explanation, f, indent=2)
    print(f"\n  ✓ Sample explanation saved → {EVAL_DIR}/sample_explanation.json")

    print("\n" + "=" * 60)
    print("SHAP analysis complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
