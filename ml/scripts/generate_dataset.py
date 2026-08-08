"""
PayGuard – Synthetic UPI Transaction Dataset Generator
=======================================================
Generates a realistic synthetic dataset of UPI transactions with injected
fraud patterns for training the hybrid fraud detection pipeline.

Fraud patterns modeled:
  - High-value transactions at unusual hours (late night)
  - Rapid transaction bursts (velocity attacks)
  - Geographic anomalies (location mismatches)
  - Device / OS switching between consecutive transactions
  - Unusual merchant categories for the user profile

Output: ml/datasets/upi_transactions.csv (~10,000 rows, ~5% fraud rate)
"""

import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SEED = 42
NUM_TRANSACTIONS = 10_000
FRAUD_RATE = 0.05
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "datasets")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "upi_transactions.csv")

MERCHANT_CATEGORIES = [
    "grocery", "electronics", "food_delivery", "travel", "fuel",
    "entertainment", "utilities", "healthcare", "education", "fashion",
    "jewellery", "real_estate", "insurance", "gaming", "charity",
]

PAYMENT_TYPES = ["p2p", "p2m", "bill_payment", "recharge", "subscription"]

DEVICE_TYPES = ["android", "ios", "web", "feature_phone"]

OS_TYPES = ["android_13", "android_14", "ios_17", "ios_18", "windows", "linux"]

BANK_NAMES = [
    "SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB",
    "BOB", "Canara", "IndusInd", "Yes_Bank", "Federal", "IDBI",
]

CITIES = [
    ("Mumbai", 19.076, 72.877),
    ("Delhi", 28.644, 77.216),
    ("Bangalore", 12.971, 77.594),
    ("Hyderabad", 17.385, 78.486),
    ("Chennai", 13.082, 80.270),
    ("Kolkata", 22.572, 88.363),
    ("Pune", 18.520, 73.856),
    ("Ahmedabad", 23.022, 72.571),
    ("Jaipur", 26.912, 75.787),
    ("Lucknow", 26.846, 80.946),
]

np.random.seed(SEED)
random.seed(SEED)


def _generate_upi_id(user_idx: int) -> str:
    """Generate a realistic UPI ID."""
    prefixes = ["user", "pay", "txn", "upi"]
    banks = ["oksbi", "okaxis", "okicici", "okhdfcbank", "ybl", "paytm", "apl"]
    prefix = random.choice(prefixes)
    bank = random.choice(banks)
    return f"{prefix}{user_idx:04d}@{bank}"


def _generate_merchant_id() -> str:
    """Generate a merchant identifier."""
    return f"MER{random.randint(1000, 9999)}"


def _generate_ip() -> str:
    """Generate a plausible Indian IP address."""
    first_octet = random.choice([103, 106, 117, 122, 157, 182, 203])
    return f"{first_octet}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


def _generate_legitimate_transaction(
    tx_id: int,
    user_idx: int,
    base_time: datetime,
) -> dict:
    """Create a single legitimate transaction with realistic distributions."""
    city_name, lat, lng = random.choice(CITIES)
    
    # Allow amounts up to 1L (100,000) for real-world UPI cap
    amount = round(np.random.lognormal(mean=5.5, sigma=1.2), 2)
    amount = min(amount, 100_000.0) 

    # Legitimate transactions happen at all hours, with a slight peak during the day
    if random.random() < 0.20:
        hour = random.randint(0, 23)  # 20% completely random time (including late night)
    else:
        hour = int(np.random.normal(loc=14, scale=4))
        hour = max(0, min(hour, 23))
        
    timestamp = base_time + timedelta(
        days=random.randint(0, 89),
        hours=hour,
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )
    
    # 95% chance of normal device, 5% chance they use an unusual device (web/feature phone)
    device_choices = DEVICE_TYPES[:2] if random.random() < 0.95 else DEVICE_TYPES
    os_choices = OS_TYPES[:4] if random.random() < 0.95 else OS_TYPES

    return {
        "transaction_id": f"TXN{tx_id:06d}",
        "user_id": f"USR{user_idx:04d}",
        "upi_id": _generate_upi_id(user_idx),
        "amount": amount,
        "merchant_category": random.choice(MERCHANT_CATEGORIES),
        "merchant_id": _generate_merchant_id(),
        "location_city": city_name,
        "location_lat": round(lat + np.random.normal(0, 0.01), 6),
        "location_lng": round(lng + np.random.normal(0, 0.01), 6),
        "timestamp": timestamp,
        "payment_type": random.choice(PAYMENT_TYPES),
        "device_type": random.choice(device_choices),
        "ip_address": _generate_ip(),
        "os_type": random.choice(os_choices),
        "bank_name": random.choice(BANK_NAMES),
        "is_fraud": 0,
    }


def _generate_fraudulent_transaction(
    tx_id: int,
    user_idx: int,
    base_time: datetime,
) -> dict:
    """
    Create a fraudulent transaction by injecting anomalous patterns:
      - Occurs at ANY time of day (to prevent time-overfitting)
      - Variable high amounts
      - Device/OS mismatch (simulating account takeover)
      - Location mismatch (simulating remote fraudster)
      - High-risk merchants
    """
    city_name, lat, lng = random.choice(CITIES)
    lat_offset = np.random.uniform(2.0, 5.0) * random.choice([-1, 1])
    lng_offset = np.random.uniform(2.0, 5.0) * random.choice([-1, 1])

    # Fraud happens uniformly at ANY hour. The model MUST NOT rely purely on time.
    hour = random.randint(0, 23)
    
    # 70% of fraud involves high amounts, 30% involves small test amounts
    if random.random() < 0.70:
        amount = round(np.random.lognormal(mean=9.0, sigma=1.2), 2)
        amount = min(amount, 5_000_000.0) # Massive outliers
    else:
        amount = round(np.random.uniform(1.0, 50.0), 2) # Pinging with small amounts
        
    timestamp = base_time + timedelta(
        days=random.randint(0, 89),
        hours=hour,
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )

    # Fraudsters often use web interfaces, emulators, or feature phones (account takeover)
    # But 40% of the time they use normal devices to blend in
    device_choices = DEVICE_TYPES[2:] if random.random() < 0.60 else DEVICE_TYPES[:2]
    os_choices = OS_TYPES[4:] if random.random() < 0.60 else OS_TYPES[:4]

    return {
        "transaction_id": f"TXN{tx_id:06d}",
        "user_id": f"USR{user_idx:04d}",
        "upi_id": _generate_upi_id(user_idx),
        "amount": amount,
        "merchant_category": random.choice(["jewellery", "real_estate", "gaming", "electronics", "charity"]),
        "merchant_id": _generate_merchant_id(),
        "location_city": city_name,
        "location_lat": round(lat + lat_offset, 6),
        "location_lng": round(lng + lng_offset, 6),
        "timestamp": timestamp,
        "payment_type": random.choice(PAYMENT_TYPES),
        "device_type": random.choice(device_choices),
        "ip_address": _generate_ip(),
        "os_type": random.choice(os_choices),
        "bank_name": random.choice(BANK_NAMES),
        "is_fraud": 1,
    }


def generate_dataset() -> pd.DataFrame:
    """
    Generate the full synthetic dataset with the target fraud rate.

    Returns:
        pd.DataFrame with NUM_TRANSACTIONS rows.
    """
    num_fraud = int(NUM_TRANSACTIONS * FRAUD_RATE)
    num_legit = NUM_TRANSACTIONS - num_fraud
    num_users = 500  # simulate 500 unique users
    base_time = datetime(2026, 4, 1)

    records: list[dict] = []

    # --- Legitimate transactions ---
    for i in range(num_legit):
        user_idx = random.randint(1, num_users)
        records.append(_generate_legitimate_transaction(i + 1, user_idx, base_time))

    # --- Fraudulent transactions ---
    for i in range(num_fraud):
        user_idx = random.randint(1, num_users)
        records.append(
            _generate_fraudulent_transaction(num_legit + i + 1, user_idx, base_time)
        )

    df = pd.DataFrame(records)
    df = df.sample(frac=1, random_state=SEED).reset_index(drop=True)

    return df


def main() -> None:
    """Generate and save the synthetic dataset."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("PayGuard – Synthetic Dataset Generator")
    print("=" * 60)

    df = generate_dataset()

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n> Dataset saved to: {OUTPUT_FILE}")
    print(f"  Total transactions : {len(df):,}")
    print(f"  Legitimate         : {(df['is_fraud'] == 0).sum():,}")
    print(f"  Fraudulent         : {(df['is_fraud'] == 1).sum():,}")
    print(f"  Fraud rate         : {df['is_fraud'].mean():.2%}")
    print(f"  Unique users       : {df['user_id'].nunique()}")
    print(f"  Date range         : {df['timestamp'].min()} -> {df['timestamp'].max()}")
    print(f"  Columns            : {list(df.columns)}")


if __name__ == "__main__":
    main()
