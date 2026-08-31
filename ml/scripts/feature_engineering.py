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
            
        CATEGORY_LIMITS = {
            "grocery": (1500, 10000), "food_delivery": (500, 3000), "entertainment": (1000, 5000),
            "utilities": (2000, 15000), "fuel": (2000, 10000), "fashion": (3000, 20000),
            "electronics": (15000, 100000), "travel": (10000, 80000), "healthcare": (5000, 50000),
            "education": (20000, 150000), "jewellery": (30000, 300000), "real_estate": (50000, 500000),
            "insurance": (10000, 50000), "gaming": (1000, 10000), "charity": (1000, 10000),
            "crypto": (50000, 500000), "betting": (5000, 50000),
        }
            
        # New Feature: High Amount Flag & Amount vs Category Average
        if "amount" in ref.columns:
            df["is_high_amount"] = (ref["amount"] > 50000).astype(int)
            if "merchant_category" in ref.columns:
                # Map the mean amount for the category
                category_means = ref["merchant_category"].map(lambda c: CATEGORY_LIMITS.get(c, (2000, 20000))[0])
                # Ratio of actual amount to category average
                df["amount_vs_category_avg"] = ref["amount"] / category_means
            else:
                df["amount_vs_category_avg"] = ref["amount"] / 2000.0
        else:
            df["is_high_amount"] = 0
            df["amount_vs_category_avg"] = 0
            
        # New Feature: Is unusual hour for physical retail
        if "merchant_category" in ref.columns and "hour" in df.columns:
            physical_categories = ["grocery", "fashion", "electronics", "jewellery", "fuel"]
            df["is_unusual_hour_for_category"] = (
                ref["merchant_category"].isin(physical_categories) & 
                df["is_late_night"].astype(bool)
            ).astype(int)
        else:
            df["is_unusual_hour_for_category"] = 0
            
        # New Feature: Risky Merchant Category
        risky_categories = ["jewellery", "real_estate", "gaming", "crypto", "betting"]
        if "merchant_category" in ref.columns:
            df["is_risky_merchant"] = ref["merchant_category"].isin(risky_categories).astype(int)
        else:
            df["is_risky_merchant"] = 0
            
        # New Features: Behavioral Context (New IP, New Device, New Merchant)
        if "user_id" in ref.columns:
            # We sort by timestamp to do cumulative counts properly if it's the full training set
            if "timestamp" in ref.columns:
                ref_sorted = ref.sort_values(["user_id", "timestamp"])
            else:
                ref_sorted = ref
                
            if "ip_address" in ref.columns:
                # Cumulative count of this IP for this user prior to this transaction
                cum_ip = ref_sorted.groupby(["user_id", "ip_address"]).cumcount()
                # If cumcount == 0, it's the first time they used this IP
                df["is_new_ip"] = (cum_ip == 0).astype(int).reindex(df.index)
            else:
                df["is_new_ip"] = 1
                
            if "device_type" in ref.columns and "os_type" in ref.columns:
                # Combine to device signature
                device_sig = ref_sorted["device_type"].astype(str) + "_" + ref_sorted["os_type"].astype(str)
                cum_device = device_sig.groupby(ref_sorted["user_id"]).cumcount() # Wait, no, group by user_id AND device_sig
                cum_device = ref_sorted.assign(sig=device_sig).groupby(["user_id", "sig"]).cumcount()
                df["is_new_device"] = (cum_device == 0).astype(int).reindex(df.index)
            else:
                df["is_new_device"] = 1
                
            if "merchant_id" in ref.columns:
                cum_merch = ref_sorted.groupby(["user_id", "merchant_id"]).cumcount()
                df["is_new_merchant"] = (cum_merch == 0).astype(int).reindex(df.index)
            else:
                df["is_new_merchant"] = 1
                
            # Unusual Category
            if "merchant_category" in ref.columns:
                cum_cat = ref_sorted.groupby(["user_id", "merchant_category"]).cumcount()
                df["is_new_category"] = (cum_cat == 0).astype(int).reindex(df.index)
            else:
                df["is_new_category"] = 1
                
        else:
            # If no user_id (e.g. single prediction without history), assume worst-case for security
            df["is_new_ip"] = 1
            df["is_new_device"] = 1
            df["is_new_merchant"] = 1
            df["is_new_category"] = 1

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
