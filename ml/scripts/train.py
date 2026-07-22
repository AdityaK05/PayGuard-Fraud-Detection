"""
PayGuard ML – Training Pipeline
"""

import os
import joblib
import pandas as pd
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
import xgboost as xgb
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

def main():
    datasets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "dataset"))
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    os.makedirs(models_dir, exist_ok=True)
    
    features_file = os.path.join(datasets_dir, "upi_dataset_features.csv")
    if not os.path.exists(features_file):
        print("Run feature engineering first!")
        return
        
    print("Loading features...")
    df = pd.read_csv(features_file)
    
    # Drop identifying columns that aren't numeric features
    cols_to_drop = ["step", "nameOrig", "nameDest", "isFlaggedFraud"]
    for c in cols_to_drop:
        if c in df.columns:
            df = df.drop(columns=[c])
            
    X = df.drop(columns=["isFraud"])
    y = df["isFraud"]
    
    # Save feature columns
    feature_columns = list(X.columns) + ["anomaly_score"]
    joblib.dump(feature_columns, os.path.join(models_dir, "feature_columns.pkl"))
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training Isolation Forest...")
    iso = IsolationForest(contamination=0.01, random_state=42, n_jobs=-1)
    iso.fit(X_train)
    joblib.dump(iso, os.path.join(models_dir, "IsolationForest.pkl"))
    
    print("Adding anomaly score to train data...")
    X_train_enriched = X_train.copy()
    X_train_enriched["anomaly_score"] = iso.decision_function(X_train)
    
    X_test_enriched = X_test.copy()
    X_test_enriched["anomaly_score"] = iso.decision_function(X_test)
    
    print("Training XGBoost...")
    # Calculate scale_pos_weight
    neg = sum(y_train == 0)
    pos = sum(y_train == 1)
    scale_pos_weight = neg / pos if pos > 0 else 1.0
    
    clf = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train_enriched, y_train)
    joblib.dump(clf, os.path.join(models_dir, "XGBoost.pkl"))
    
    print("Evaluating...")
    y_pred = clf.predict(X_test_enriched)
    y_prob = clf.predict_proba(X_test_enriched)[:, 1]
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "model_version": "2.0.0"
    }
    
    with open(os.path.join(models_dir, "training_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print("Training Complete!")
    print(metrics)

if __name__ == "__main__":
    main()
