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
        
        # New Feature: Origin Balance Error
        # Expected new balance: oldbalance - amount
        # Error: actual new balance - expected new balance
        if "oldbalanceOrg" in ref.columns and "amount" in ref.columns and "newbalanceOrig" in ref.columns:
            df["errorBalanceOrig"] = ref["newbalanceOrig"] + ref["amount"] - ref["oldbalanceOrg"]
        else:
            df["errorBalanceOrig"] = 0
            
        # New Feature: Dest Balance Error
        # Expected new balance: oldbalance + amount
        # Error: expected new balance - actual new balance
        if "oldbalanceDest" in ref.columns and "amount" in ref.columns and "newbalanceDest" in ref.columns:
            df["errorBalanceDest"] = ref["oldbalanceDest"] + ref["amount"] - ref["newbalanceDest"]
        else:
            df["errorBalanceDest"] = 0
            
        # New Feature: Is Merchant
        if "nameDest" in ref.columns:
            df["isMerchant"] = ref["nameDest"].astype(str).str.startswith("M").astype(int)
        else:
            df["isMerchant"] = 0
            
        df = df.fillna(0)
        return df

def main():
    datasets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dataset"))
    preprocessed_file = os.path.join(datasets_dir, "upi_dataset_preprocessed.csv")
    
    if not os.path.exists(preprocessed_file):
        print("Run preprocessing first!")
        return
        
    print("Feature engineering...")
    df_preprocessed = pd.read_csv(preprocessed_file)
    
    fe = FeatureEngineer()
    df_enriched = fe.transform(df_preprocessed, raw_df=df_preprocessed)
    
    output_file = os.path.join(datasets_dir, "upi_dataset_features.csv")
    df_enriched.to_csv(output_file, index=False)
    print(f"Features saved to {output_file}")
    
if __name__ == "__main__":
    main()
