"""
PayGuard – Data Preprocessing Module
======================================
Handles all data cleaning, encoding, and scaling operations required
before feature engineering and model training.

Pipeline:
  1. Handle missing values (median for numeric, mode for categorical)
  2. Remove duplicate transactions
  3. Handle outliers via IQR capping
  4. Label-encode categorical variables
  5. Standard-scale numerical features
  6. Persist Scaler and Encoder artifacts

Artifacts saved:
  - ml/models/Scaler.pkl
  - ml/models/Encoder.pkl
"""

import os
import warnings
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

warnings.filterwarnings("ignore")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

CATEGORICAL_COLUMNS = [
    "merchant_category",
    "payment_type",
    "device_type",
    "os_type",
    "bank_name",
    "location_city",
]

NUMERICAL_COLUMNS = [
    "amount",
    "location_lat",
    "location_lng",
]

# Columns that should not be fed to the model
DROP_COLUMNS = [
    "transaction_id",
    "user_id",
    "upi_id",
    "merchant_id",
    "ip_address",
    "timestamp",
]


class DataPreprocessor:
    """
    Stateful preprocessor that fits on training data and transforms
    both training and inference data consistently.
    """

    def __init__(self) -> None:
        self.encoders: dict[str, LabelEncoder] = {}
        self.scaler: StandardScaler = StandardScaler()
        self._fitted = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Fit the preprocessor on training data and return the transformed
        DataFrame (without the target column).

        Args:
            df: Raw training DataFrame (must include `is_fraud` column).

        Returns:
            Cleaned, encoded, and scaled DataFrame ready for feature engineering.
        """
        df = df.copy()
        df = self._handle_missing(df)
        df = self._remove_duplicates(df)
        df = self._handle_outliers(df)
        df = self._extract_temporal_features(df)
        df = self._drop_unused(df)
        df = self._encode_categoricals(df, fit=True)
        df = self._scale_numericals(df, fit=True)
        self._fitted = True
        return df

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Transform new data using the already-fitted preprocessor.

        Args:
            df: Raw DataFrame for inference (may or may not have `is_fraud`).

        Returns:
            Preprocessed DataFrame.
        """
        if not self._fitted:
            raise RuntimeError("Preprocessor has not been fitted. Call fit_transform() first.")

        df = df.copy()
        df = self._handle_missing(df)
        df = self._extract_temporal_features(df)
        df = self._drop_unused(df)
        df = self._encode_categoricals(df, fit=False)
        df = self._scale_numericals(df, fit=False)
        return df

    def save(self, directory: Optional[str] = None) -> None:
        """Persist encoder and scaler artifacts to disk."""
        save_dir = directory or MODELS_DIR
        os.makedirs(save_dir, exist_ok=True)

        joblib.dump(self.scaler, os.path.join(save_dir, "Scaler.pkl"))
        joblib.dump(self.encoders, os.path.join(save_dir, "Encoder.pkl"))
        print(f"  ✓ Scaler saved  → {save_dir}/Scaler.pkl")
        print(f"  ✓ Encoders saved → {save_dir}/Encoder.pkl")

    @classmethod
    def load(cls, directory: Optional[str] = None) -> "DataPreprocessor":
        """Load a previously saved preprocessor from disk."""
        load_dir = directory or MODELS_DIR
        instance = cls()
        instance.scaler = joblib.load(os.path.join(load_dir, "Scaler.pkl"))
        instance.encoders = joblib.load(os.path.join(load_dir, "Encoder.pkl"))
        instance._fitted = True
        return instance

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _handle_missing(df: pd.DataFrame) -> pd.DataFrame:
        """Impute missing values: median for numeric, mode for categorical."""
        for col in df.select_dtypes(include=[np.number]).columns:
            if df[col].isna().any():
                df[col] = df[col].fillna(df[col].median())

        for col in df.select_dtypes(include=["object", "category"]).columns:
            if df[col].isna().any():
                mode_val = df[col].mode()
                df[col] = df[col].fillna(mode_val[0] if len(mode_val) > 0 else "unknown")

        return df

    @staticmethod
    def _remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
        """Remove exact duplicate rows."""
        before = len(df)
        df = df.drop_duplicates()
        removed = before - len(df)
        if removed > 0:
            print(f"  ✓ Removed {removed} duplicate rows")
        return df

    @staticmethod
    def _handle_outliers(df: pd.DataFrame) -> pd.DataFrame:
        """
        Cap outliers using the IQR method for the `amount` column.
        Values beyond Q1 - 1.5*IQR or Q3 + 1.5*IQR are clipped.
        """
        if "amount" in df.columns:
            q1 = df["amount"].quantile(0.25)
            q3 = df["amount"].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            clipped = ((df["amount"] < lower) | (df["amount"] > upper)).sum()
            df["amount"] = df["amount"].clip(lower=max(lower, 0), upper=upper)
            if clipped > 0:
                print(f"  ✓ Capped {clipped} outlier amounts (IQR method)")
        return df

    @staticmethod
    def _extract_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract hour, day-of-week, and day-of-month from the timestamp
        before dropping it. These become numerical features.
        """
        if "timestamp" in df.columns:
            ts = pd.to_datetime(df["timestamp"], errors="coerce")
            df["tx_hour"] = ts.dt.hour
            df["tx_day_of_week"] = ts.dt.dayofweek  # 0=Mon, 6=Sun
            df["tx_day_of_month"] = ts.dt.day
        return df

    @staticmethod
    def _drop_unused(df: pd.DataFrame) -> pd.DataFrame:
        """Drop columns that are identifiers / not useful for modeling."""
        existing = [c for c in DROP_COLUMNS if c in df.columns]
        return df.drop(columns=existing)

    def _encode_categoricals(self, df: pd.DataFrame, fit: bool) -> pd.DataFrame:
        """Label-encode categorical columns."""
        for col in CATEGORICAL_COLUMNS:
            if col not in df.columns:
                continue

            if fit:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.encoders[col] = le
            else:
                le = self.encoders.get(col)
                if le is None:
                    continue
                # Handle unseen labels gracefully
                known = set(le.classes_)
                df[col] = df[col].astype(str).apply(
                    lambda x, _k=known, _le=le: (
                        _le.transform([x])[0] if x in _k else -1
                    )
                )
        return df

    def _scale_numericals(self, df: pd.DataFrame, fit: bool) -> pd.DataFrame:
        """Standard-scale numerical columns (including extracted temporal ones)."""
        num_cols = [c for c in NUMERICAL_COLUMNS if c in df.columns]
        # Also scale the temporal features we extracted
        temporal = ["tx_hour", "tx_day_of_week", "tx_day_of_month"]
        num_cols += [c for c in temporal if c in df.columns]

        if not num_cols:
            return df

        if fit:
            df[num_cols] = self.scaler.fit_transform(df[num_cols])
        else:
            df[num_cols] = self.scaler.transform(df[num_cols])

        return df


# ---------------------------------------------------------------------------
# Standalone execution
# ---------------------------------------------------------------------------

def main() -> None:
    """Run preprocessing on the generated dataset and save artifacts."""
    datasets_dir = os.path.join(os.path.dirname(__file__), "..", "datasets")
    input_file = os.path.join(datasets_dir, "upi_transactions.csv")

    if not os.path.exists(input_file):
        print("✗ Dataset not found. Run generate_dataset.py first.")
        return

    print("=" * 60)
    print("PayGuard – Data Preprocessing")
    print("=" * 60)

    df = pd.read_csv(input_file)
    print(f"\n  Raw shape: {df.shape}")

    preprocessor = DataPreprocessor()
    df_processed = preprocessor.fit_transform(df)
    preprocessor.save()

    output_file = os.path.join(datasets_dir, "upi_transactions_preprocessed.csv")
    df_processed.to_csv(output_file, index=False)
    print(f"\n  ✓ Preprocessed data saved → {output_file}")
    print(f"  Processed shape: {df_processed.shape}")
    print(f"  Columns: {list(df_processed.columns)}")


if __name__ == "__main__":
    main()
