"""
PayGuard ML – Feature Engineering Module
"""

import os
import numpy as np
import pandas as pd
from typing import Optional

class FeatureEngineer:
    def __init__(self):
        pass

    def transform(self, df: pd.DataFrame, raw_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        df = df.copy()
        ref = raw_df if raw_df is not None else df
        
        # New Feature: Hour of Day
        if "timestamp" in ref.columns:
            # Convert to datetime if it's string
            timestamps = pd.to_datetime(ref["timestamp"], format='mixed', utc=True)
            df["hour"] = timestamps.dt.hour
            # New Feature: Is Late Night (11 PM - 4 AM)
            df["is_late_night"] = df["hour"].apply(lambda h: 1 if h >= 23 or h <= 4 else 0)
        else:
            df["hour"] = 12
            df["is_late_night"] = 0
            
        # New Feature: High Amount Flag
        if "amount" in ref.columns:
            df["is_high_amount"] = (ref["amount"] > 50000).astype(int)
        else:
            df["is_high_amount"] = 0
            
        # New Feature: Risky Merchant Category
        risky_categories = ["jewellery", "real_estate", "gaming"]
        if "merchant_category" in ref.columns:
            df["is_risky_merchant"] = ref["merchant_category"].isin(risky_categories).astype(int)
        else:
            df["is_risky_merchant"] = 0
            
        df = df.fillna(0)
        return df

def main():
    datasets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
    preprocessed_file = os.path.join(datasets_dir, "upi_transactions_preprocessed.csv")
    
    if not os.path.exists(preprocessed_file):
        print("Run preprocessing first!")
        return
        
    print("Feature engineering...")
    df_preprocessed = pd.read_csv(preprocessed_file)
    
    fe = FeatureEngineer()
    df_enriched = fe.transform(df_preprocessed, raw_df=df_preprocessed)
    
    output_file = os.path.join(datasets_dir, "upi_transactions_features.csv")
    df_enriched.to_csv(output_file, index=False)
    print(f"Features saved to {output_file}")
    
if __name__ == "__main__":
    main()
