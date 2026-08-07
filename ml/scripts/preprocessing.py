"""
PayGuard ML – Data Preprocessing Module
"""

import os
import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

class DataPreprocessor:
    def __init__(self):
        self.numeric_features = [
            "amount", "location_lat", "location_lng"
        ]
        self.categorical_features = [
            "payment_type", "device_type", "os_type", "bank_name", 
            "merchant_category", "location_city"
        ]
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), self.numeric_features),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), self.categorical_features)
            ],
            remainder="drop"
        )
        self.feature_names_out = None

    def fit(self, df: pd.DataFrame):
        self.preprocessor.fit(df)
        
        # Get feature names
        cat_features = self.preprocessor.named_transformers_["cat"].get_feature_names_out(self.categorical_features)
        self.feature_names_out = self.numeric_features + list(cat_features)
        
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        processed_data = self.preprocessor.transform(df)
        
        if self.feature_names_out is None:
            # If not fitted, assume we are predicting and feature names are stored elsewhere
            cat_features = self.preprocessor.named_transformers_["cat"].get_feature_names_out(self.categorical_features)
            self.feature_names_out = self.numeric_features + list(cat_features)
            
        return pd.DataFrame(processed_data, columns=self.feature_names_out, index=df.index)

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        self.fit(df)
        return self.transform(df)

    def save(self, output_dir: str):
        os.makedirs(output_dir, exist_ok=True)
        joblib.dump(self, os.path.join(output_dir, "Preprocessor.pkl"))
        print(f"  > Preprocessor saved to {output_dir}")

    @classmethod
    def load(cls, input_dir: str) -> "DataPreprocessor":
        return joblib.load(os.path.join(input_dir, "Preprocessor.pkl"))

if __name__ == "__main__":
    datasets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    
    raw_file = os.path.join(datasets_dir, "upi_transactions.csv")
    
    print("Loading raw data...")
    df = pd.read_csv(raw_file)
    
    print("Preprocessing data...")
    preprocessor = DataPreprocessor()
    df_processed = preprocessor.fit_transform(df)
    
    # Save the target variable back into the processed df for the next step
    if "is_fraud" in df.columns:
        df_processed["is_fraud"] = df["is_fraud"].values
        
    # We also need some original columns for feature engineering
    for col in ["transaction_id", "user_id", "upi_id", "timestamp", "ip_address", "merchant_id"]:
        if col in df.columns:
            df_processed[col] = df[col].values
            
    output_file = os.path.join(datasets_dir, "upi_transactions_preprocessed.csv")
    df_processed.to_csv(output_file, index=False)
    
    preprocessor.save(models_dir)
    print("Preprocessing complete!")
