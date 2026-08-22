import sys, os, pandas as pd
import __main__
sys.path.insert(0, os.path.abspath('ml/scripts'))
from preprocessing import DataPreprocessor
from feature_engineering import FeatureEngineer
__main__.DataPreprocessor = DataPreprocessor
__main__.FeatureEngineer = FeatureEngineer
from predict import FraudPredictor
predictor = FraudPredictor.load(os.path.abspath('ml/models'))

def run_pred(desc, tx):
    res = predictor.predict(tx)
    print(f'{desc} -> Risk Score: {res.risk_score} (Anomaly: {res.anomaly_score:.3f}, IF_comp: {res.risk_score}, XGB_prob: {res.fraud_probability:.3f})')

tx_base = {
    'transaction_id': 'T', 'payment_type': 'p2m', 'merchant_category': 'electronics', 'merchant_id': 'M1', 
    'bank_name': 'HDFC', 'location_city': 'Mumbai', 'location_lat': 19.0, 'location_lng': 72.8, 
    'device_type': 'android', 'os_type': 'android_14', 'ip_address': '1.1.1.1'
}

print("--- Standard Mobile Device ---")
run_pred('Legit Amt (100) / Daytime (14:00)', {**tx_base, 'amount': 100, 'timestamp': '2026-08-07T14:00:00.000Z'})
run_pred('Legit Amt (100) / Nighttime (02:00)', {**tx_base, 'amount': 100, 'timestamp': '2026-08-07T02:00:00.000Z'})
run_pred('Massive Amt (10k) / Daytime (14:00)', {**tx_base, 'amount': 10000, 'timestamp': '2026-08-07T14:00:00.000Z'})
run_pred('Massive Amt (10k) / Nighttime (02:00)', {**tx_base, 'amount': 10000, 'timestamp': '2026-08-07T02:00:00.000Z'})

print("\n--- Unusual Device (Web / Windows) ---")
tx_anom = {**tx_base, 'device_type': 'web', 'os_type': 'windows'}
run_pred('Legit Amt (100) / Daytime (14:00)', {**tx_anom, 'amount': 100, 'timestamp': '2026-08-07T14:00:00.000Z'})
run_pred('Legit Amt (100) / Nighttime (02:00)', {**tx_anom, 'amount': 100, 'timestamp': '2026-08-07T02:00:00.000Z'})
run_pred('Massive Amt (10k) / Daytime (14:00)', {**tx_anom, 'amount': 10000, 'timestamp': '2026-08-07T14:00:00.000Z'})
run_pred('Massive Amt (10k) / Nighttime (02:00)', {**tx_anom, 'amount': 10000, 'timestamp': '2026-08-07T02:00:00.000Z'})
