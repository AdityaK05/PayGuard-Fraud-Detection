"""
PayGuard – Feature Engineering Module
=======================================
Derives behavioral, temporal, and statistical features that significantly
improve fraud detection performance beyond raw transaction attributes.

Engineered features (15+):
  1.  tx_velocity_1h        – Transactions by this user in the last hour
  2.  tx_velocity_24h       – Transactions by this user in the last 24 hours
  3.  avg_spending_7d       – User's average spending over last 7 days
  4.  location_mismatch     – Binary: current location ≠ user's most frequent city
  5.  device_mismatch       – Binary: current device ≠ user's most used device
  6.  is_night_tx           – Binary: transaction between 11 PM and 5 AM
  7.  is_weekend_tx         – Binary: Saturday or Sunday
  8.  merchant_risk_score   – Historical fraud rate for this merchant category
  9.  spending_trend        – Ratio of current amount to user's rolling average
  10. account_age_days      – Days since the user's first transaction
  11. tx_distance_km        – Haversine distance from user's average location
  12. tx_entropy            – Shannon entropy of user's merchant category distribution
  13. payment_success_ratio – Fraction of user's non-fraud transactions
  14. prev_fraud_count      – Count of past fraud flags for this user
  15. geo_risk_score        – Regional fraud density score
  16. behavior_deviation    – Z-score of amount relative to user's history

These features are computed from the dataset itself (group-level aggregations),
making them suitable for both batch training and real-time inference when backed
by a user-history cache.
"""

import os
from typing import Optional

import numpy as np
import pandas as pd


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compute the great-circle distance between two points on Earth (in km)
    using the Haversine formula.
    """
    r = 6_371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * r * np.arcsin(np.sqrt(a))


class FeatureEngineer:
    """
    Derives fraud-detection features from preprocessed transaction data.

    Usage:
        fe = FeatureEngineer()
        df_enriched = fe.transform(df_preprocessed)
    """

    def __init__(self) -> None:
        # Cached aggregates (populated during batch transform)
        self._user_stats: Optional[pd.DataFrame] = None
        self._merchant_risk: Optional[pd.Series] = None
        self._city_risk: Optional[pd.Series] = None

    def transform(self, df: pd.DataFrame, raw_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """
        Add all engineered features to the DataFrame.

        Args:
            df:     Preprocessed DataFrame (encoded/scaled).
            raw_df: Original raw DataFrame with timestamps and IDs
                    (needed for group-level aggregations). If None,
                    the method will use whatever columns are available.

        Returns:
            DataFrame with additional feature columns.
        """
        df = df.copy()

        # If raw_df is provided, use it for time-based and user-based features
        ref = raw_df if raw_df is not None else df

        df = self._add_night_weekend(df)
        df = self._add_velocity_features(df, ref)
        df = self._add_spending_features(df, ref)
        df = self._add_location_features(df, ref)
        df = self._add_device_mismatch(df, ref)
        df = self._add_merchant_risk(df, ref)
        df = self._add_account_age(df, ref)
        df = self._add_entropy(df, ref)
        df = self._add_success_ratio(df, ref)
        df = self._add_prev_fraud_count(df, ref)
        df = self._add_geo_risk(df, ref)
        df = self._add_behavior_deviation(df, ref)

        # Fill any NaN introduced by group operations
        df = df.fillna(0)

        return df

    # ------------------------------------------------------------------
    # Individual feature generators
    # ------------------------------------------------------------------

    @staticmethod
    def _add_night_weekend(df: pd.DataFrame) -> pd.DataFrame:
        """is_night_tx (23-05h) and is_weekend_tx (Sat/Sun)."""
        if "tx_hour" in df.columns:
            # tx_hour may be scaled; use raw-ish threshold
            # During preprocessing, hour is standardized. We check the original range.
            # If scaled, we approximate: night ≈ low or high z-scores
            # For robustness, we add these before scaling in the pipeline,
            # but as a fallback we handle both cases.
            df["is_night_tx"] = 0
            df["is_weekend_tx"] = 0

            # If tx_hour looks like raw (0-23 range), use direct comparison
            hour_max = df["tx_hour"].max()
            if hour_max > 5:  # likely raw hours
                df["is_night_tx"] = ((df["tx_hour"] >= 23) | (df["tx_hour"] <= 5)).astype(int)
            else:
                # Scaled: use z-score thresholds (night hours have extreme z-scores)
                df["is_night_tx"] = (df["tx_hour"].abs() > 1.5).astype(int)

            if "tx_day_of_week" in df.columns:
                dow_max = df["tx_day_of_week"].max()
                if dow_max > 2:  # raw day of week (0-6)
                    df["is_weekend_tx"] = (df["tx_day_of_week"] >= 5).astype(int)
                else:
                    df["is_weekend_tx"] = (df["tx_day_of_week"] > 1.0).astype(int)

        return df

    @staticmethod
    def _add_velocity_features(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """
        Transaction velocity: count of transactions per user in rolling windows.
        Since we don't have exact timestamps in the preprocessed data, we use
        the index order as a proxy and compute rolling counts.
        """
        if "user_id" not in ref.columns:
            # Assign synthetic user indices based on row order
            df["tx_velocity_1h"] = 1
            df["tx_velocity_24h"] = 1
            return df

        # Use raw_df to compute per-user transaction counts
        user_counts = ref.groupby("user_id").cumcount()
        # Velocity: number of transactions in the last N rows for this user
        # (proxy for time-based velocity)
        df["tx_velocity_1h"] = ref.groupby("user_id")["user_id"].transform(
            lambda x: x.rolling(window=3, min_periods=1).count()
        ).values
        df["tx_velocity_24h"] = ref.groupby("user_id")["user_id"].transform(
            lambda x: x.rolling(window=10, min_periods=1).count()
        ).values

        return df

    @staticmethod
    def _add_spending_features(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Average spending and spending trend."""
        if "user_id" in ref.columns and "amount" in ref.columns:
            user_avg = ref.groupby("user_id")["amount"].transform("mean")
            df["avg_spending_7d"] = user_avg.values
            df["spending_trend"] = np.where(
                user_avg.values > 0,
                ref["amount"].values / user_avg.values,
                1.0,
            )
        else:
            df["avg_spending_7d"] = df.get("amount", 0)
            df["spending_trend"] = 1.0

        return df

    @staticmethod
    def _add_location_features(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Location mismatch and distance from user's average location."""
        df["location_mismatch"] = 0
        df["tx_distance_km"] = 0.0

        if "user_id" in ref.columns and "location_lat" in ref.columns:
            # User's average location
            user_loc = ref.groupby("user_id")[["location_lat", "location_lng"]].transform("mean")

            # Distance from average
            distances = []
            for i in range(len(ref)):
                d = haversine_km(
                    ref["location_lat"].iloc[i],
                    ref["location_lng"].iloc[i],
                    user_loc["location_lat"].iloc[i],
                    user_loc["location_lng"].iloc[i],
                )
                distances.append(d)
            df["tx_distance_km"] = distances

            # Mismatch: distance > 100 km from average
            df["location_mismatch"] = (df["tx_distance_km"] > 100).astype(int)

        return df

    @staticmethod
    def _add_device_mismatch(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Binary flag if current device differs from user's most-used device."""
        df["device_mismatch"] = 0

        if "user_id" in ref.columns and "device_type" in ref.columns:
            user_mode_device = ref.groupby("user_id")["device_type"].transform(
                lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else x.iloc[0]
            )
            df["device_mismatch"] = (ref["device_type"].values != user_mode_device.values).astype(int)

        return df

    @staticmethod
    def _add_merchant_risk(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Historical fraud rate per merchant category."""
        df["merchant_risk_score"] = 0.0

        if "merchant_category" in ref.columns and "is_fraud" in ref.columns:
            cat_risk = ref.groupby("merchant_category")["is_fraud"].mean()
            df["merchant_risk_score"] = ref["merchant_category"].map(cat_risk).fillna(0).values

        return df

    @staticmethod
    def _add_account_age(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Days since the user's first transaction."""
        df["account_age_days"] = 0

        if "user_id" in ref.columns and "timestamp" in ref.columns:
            ts = pd.to_datetime(ref["timestamp"], errors="coerce")
            user_first = ts.groupby(ref["user_id"]).transform("min")
            df["account_age_days"] = (ts - user_first).dt.days.fillna(0).values

        return df

    @staticmethod
    def _add_entropy(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Shannon entropy of user's merchant category distribution."""
        df["tx_entropy"] = 0.0

        if "user_id" in ref.columns and "merchant_category" in ref.columns:
            def _entropy(series: pd.Series) -> float:
                probs = series.value_counts(normalize=True)
                return float(-np.sum(probs * np.log2(probs + 1e-10)))

            user_entropy = ref.groupby("user_id")["merchant_category"].transform(
                lambda x: _entropy(x)
            )
            df["tx_entropy"] = user_entropy.values

        return df

    @staticmethod
    def _add_success_ratio(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Fraction of non-fraud transactions for this user."""
        df["payment_success_ratio"] = 1.0

        if "user_id" in ref.columns and "is_fraud" in ref.columns:
            success = ref.groupby("user_id")["is_fraud"].transform(
                lambda x: 1 - x.mean()
            )
            df["payment_success_ratio"] = success.values

        return df

    @staticmethod
    def _add_prev_fraud_count(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Cumulative count of past fraud flags for the user."""
        df["prev_fraud_count"] = 0

        if "user_id" in ref.columns and "is_fraud" in ref.columns:
            df["prev_fraud_count"] = ref.groupby("user_id")["is_fraud"].cumsum().values

        return df

    @staticmethod
    def _add_geo_risk(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """Regional fraud density score based on location city."""
        df["geo_risk_score"] = 0.0

        if "location_city" in ref.columns and "is_fraud" in ref.columns:
            city_risk = ref.groupby("location_city")["is_fraud"].mean()
            df["geo_risk_score"] = ref["location_city"].map(city_risk).fillna(0).values

        return df

    @staticmethod
    def _add_behavior_deviation(df: pd.DataFrame, ref: pd.DataFrame) -> pd.DataFrame:
        """
        Z-score of the current transaction amount relative to the
        user's historical spending distribution.
        """
        df["behavior_deviation"] = 0.0

        if "user_id" in ref.columns and "amount" in ref.columns:
            user_mean = ref.groupby("user_id")["amount"].transform("mean")
            user_std = ref.groupby("user_id")["amount"].transform("std").replace(0, 1)
            df["behavior_deviation"] = ((ref["amount"].values - user_mean.values) / user_std.values)

        return df


# ---------------------------------------------------------------------------
# Standalone execution
# ---------------------------------------------------------------------------

def main() -> None:
    """Run feature engineering on preprocessed data."""
    datasets_dir = os.path.join(os.path.dirname(__file__), "..", "datasets")
    raw_file = os.path.join(datasets_dir, "upi_transactions.csv")
    preprocessed_file = os.path.join(datasets_dir, "upi_transactions_preprocessed.csv")

    if not os.path.exists(preprocessed_file):
        print("✗ Preprocessed data not found. Run preprocessing.py first.")
        return

    print("=" * 60)
    print("PayGuard – Feature Engineering")
    print("=" * 60)

    df_preprocessed = pd.read_csv(preprocessed_file)
    df_raw = pd.read_csv(raw_file) if os.path.exists(raw_file) else None

    fe = FeatureEngineer()
    df_enriched = fe.transform(df_preprocessed, raw_df=df_raw)

    output_file = os.path.join(datasets_dir, "upi_transactions_features.csv")
    df_enriched.to_csv(output_file, index=False)
    print(f"\n  ✓ Feature-engineered data saved → {output_file}")
    print(f"  Shape: {df_enriched.shape}")
    print(f"  New features: {[c for c in df_enriched.columns if c not in df_preprocessed.columns]}")


if __name__ == "__main__":
    main()
