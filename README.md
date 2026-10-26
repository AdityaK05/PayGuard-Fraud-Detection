# 🛡️ PayGuard — AI-Powered Real-Time UPI Fraud Detection Platform

[![Python](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![XGBoost](https://img.shields.io/badge/XGBoost-v2.0%2B-FF6600.svg)](https://xgboost.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

PayGuard is an enterprise-grade, high-throughput fraud prevention and anomaly detection platform built specifically for the Unified Payments Interface (UPI) transaction ecosystem. It combines **unsupervised isolation space anomaly detection**, **gradient boosted decision trees (XGBoost)**, **TreeSHAP forensic explainability**, and a **multi-factor continuous risk calibration engine** to intercept malicious payments in under 20 milliseconds.

---

## 📊 Model Accuracy & Benchmark Metrics

The production model artifacts (`ml/models/`) were evaluated against an out-of-sample stratified test set ($20\%$ holdout) following stratified 5-fold cross-validation.

| Metric | Benchmark Score | Industry Reference Standard | Description |
| :--- | :---: | :---: | :--- |
| **Accuracy** | **98.25%** | $> 95.0\%$ | Overall proportion of correct predictions across benign & fraudulent streams |
| **ROC-AUC** | **0.9964** | $> 0.950$ | Area under the Receiver Operating Characteristic curve; exceptional discriminatory power |
| **Recall (Fraud Catch Rate)** | **95.00%** | $> 90.0\%$ | Fraction of all actual fraudulent events detected and intercepted |
| **Precision** | **76.00%** | $> 70.0\%$ | Proportion of flagged transactions that are genuine attacks (low false-positive friction) |
| **F1-Score** | **84.44%** | $> 80.0\%$ | Harmonic mean of Precision and Recall under imbalanced distribution |
| **Inference Latency** | **< 20 ms** | $< 50\text{ ms}$ | Average end-to-end inference time per transaction |
| **Active Contamination Rate** | **3.0%** | $1.0\% - 5.0\%$ | Baseline anomaly prior for unsupervised outlier bounding |

> *Source: Canonical metrics serialized in [`ml/models/training_metrics.json`](ml/models/training_metrics.json).*

---

## 🔬 End-to-End Methodologies

### 1. Data Pipeline & Imbalance Engineering
* **Dataset Synthesis & Ingestion**:
  UPI streams incorporate realistic multi-dimensional behaviors, including rapid micro-transactions (QR / P2M), household bill payments, peer-to-peer transfers (P2P), and synthetic attack vectors (credential stuffing, account takeover, nocturnal offshore drains, and crypto gateway hops).
* **Imbalance Compensation**:
  Fraud represents a minority class ($\approx 3\%$). To prevent model bias toward majority classes:
  - **Stratified Partitioning**: 80/20 train-test split stratified on `is_fraud`.
  - **Scale Positive Weight**: Dynamic loss weighting applied in XGBoost using:
    $$\text{scale\_pos\_weight} = \frac{N_{\text{negative}}}{N_{\text{positive}}}$$
    This penalizes false negatives proportionally without requiring synthetic oversampling artifacts like SMOTE that can distort spatial density.

---

### 2. Feature Engineering Pipeline (68 Total Dimensions)
The feature engineering engine ([`ml/scripts/feature_engineering.py`](ml/scripts/feature_engineering.py)) processes raw transaction payloads into 68 engineered dimensions:

1. **Temporal Signals**:
   - `hour`: Hour of day (0–23) extracted from UTC timestamp.
   - `is_late_night`: Binary indicator for transactions occurring in high-risk hours (11:00 PM – 4:00 AM).
   - `is_unusual_hour_for_category`: Flags physical merchant categories (grocery, fuel, jewellery) operating during late night.
2. **Monetary & Category Deviation**:
   - `is_high_amount`: Binary flag for amounts exceeding ₹50,000.
   - `amount_vs_category_avg`: Deviation ratio comparing current amount against historical category averages:
     $$\text{ratio} = \frac{\text{Amount}}{\text{Mean}_{\text{category}}}$$
3. **Behavioral & Identity History Counters**:
   - `is_new_ip`: Flags previously unseen IP addresses for the authenticated user.
   - `is_new_device`: Hardware/OS signature changes (e.g., unexpected mobile $\rightarrow$ web/emulator shift).
   - `is_new_merchant` & `is_new_category`: Evaluates historical transaction interaction graph.
4. **Merchant Risk Profiling**:
   - `is_risky_merchant`: High-risk sector flags (crypto exchanges, offshore betting, unverified foreign merchants).
5. **Categorical Encoding & Standardization**:
   - Scikit-Learn `OneHotEncoder` transforms payment types, bank providers, merchant categories, and operating systems.
   - `StandardScaler` scales amounts and geolocation coordinates.

---

### 3. Dual-Engine Hybrid ML Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          Incoming UPI Transaction            │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │    Preprocessing & Feature Engineering (68)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                      ┌──────────────────┴──────────────────┐
                      ▼                                     ▼
        ┌───────────────────────────┐         ┌───────────────────────────┐
        │     Isolation Forest      │         │   Feature Vector Align    │
        │   (Unsupervised Anomaly)  │         │   (No Anomaly Column)     │
        └─────────────┬─────────────┘         └─────────────┬─────────────┘
                      │                                     │
                      │ anomaly_score                       │
                      └──────────────────┬──────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       XGBoost Supervised Classifier          │
                  │   (Combines 67 Features + Anomaly Score)     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │   TreeSHAP Explainer (Feature Attribution)   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │   Calibrated Continuous Risk Engine (0-100)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                ┌────────────────────────┼────────────────────────┐
                ▼                        ▼                        ▼
        Risk Score < 25%         25% ≤ Risk < 50%          Risk Score ≥ 50%
          [ Approved ]           [ Review Queue ]            [ Blocked ]
```

#### Step A: Unsupervised Outlier Detection (Isolation Forest)
- **Model**: `IsolationForest(n_estimators=100, contamination=0.03, random_state=42)`
- Evaluates multidimensional isolation depth without relying on ground-truth labels.
- Calculates continuous `anomaly_score`: positive values denote normal transaction clusters; negative values indicate isolation outliers.

#### Step B: Supervised Gradient Boosting (XGBoost)
- **Model**: `xgb.XGBClassifier` with:
  - `n_estimators = 100`
  - `learning_rate = 0.05`
  - `max_depth = 5`
  - `reg_alpha = 5` (L1 regularizer)
  - `reg_lambda = 5` (L2 regularizer)
  - `subsample = 0.8`, `colsample_bytree = 0.8`
  - `early_stopping_rounds = 10`
- Receives the 67 engineered features **plus** the Isolation Forest `anomaly_score` as an enriched input dimension, providing both supervised precision and unsupervised outlier awareness.

---

### 4. Explainable AI (TreeSHAP)
- Utilizes `shap.TreeExplainer` on the ensemble trees to generate exact Shapley feature attributions.
- For every decision, PayGuard provides exact positive/negative contributions for top drivers (e.g., amount vs. category baseline, nocturnal timing, new device signature, offshore IP).

---

### 5. Multi-Factor Continuous Risk Calibration

Raw tree probabilities tend to cluster into narrow bands. PayGuard translates model outputs into a continuous, realistic risk index ($0 - 100$) using calibrated multi-factor weighting:

$$\text{Composite Risk} = R_{\text{base}} + \Delta_{\text{anomaly}} + \Delta_{\text{amount}} + \Delta_{\text{category}} + \Delta_{\text{temporal}} + \Delta_{\text{geo}}$$

1. **Base Probability Curve ($R_{\text{base}}$)**:
   - Safe Zone ($P < 0.20$): Maps smoothly from $2\%$ to $14\%$.
   - Review Zone ($0.20 \le P < 0.50$): Maps from $25\%$ to $48\%$.
   - Fraud Zone ($P \ge 0.50$): Maps from $58\%$ to $92\%$.
2. **Continuous Anomaly Offset ($\Delta_{\text{anomaly}}$)**:
   - For typical transactions ($\text{score} \ge 0$): Provides subtle baseline relief (up to $-2.5\%$).
   - For outliers ($\text{score} < 0$): Dynamically scales up to $+20.0\%$.
3. **Logarithmic Amount Exposure ($\Delta_{\text{amount}}$)**:
   $$\Delta_{\text{amount}} = \min\left(6.0, \max\left(0, 2.0 \cdot (\log_{10}(\text{Amount}) - 1.5)\right)\right)$$
4. **Category Ratio Deviation ($\Delta_{\text{category}}$)**:
   $$\Delta_{\text{category}} = \min\left(5.0, \max\left(0, 1.5 \cdot (\text{Ratio} - 1.0)\right)\right)$$
5. **Temporal Penalty ($\Delta_{\text{temporal}}$)**:
   $+4.0\%$ if the transaction takes place between 11:00 PM and 4:00 AM.
6. **Geolocation / Untrusted IP ($\Delta_{\text{geo}}$)**:
   $+6.0\%$ for offshore/foreign locations or high-risk IP ranges.

#### Decision Boundaries:
* **Approved (`safe`)**: Risk Score $< 25\%$ (natural distribution between $2\%$ and $22\%$).
* **Review Queue (`medium`)**: Risk Score $25\% - 49\%$ (flagged for human compliance review).
* **Blocked (`fraud`)**: Risk Score $\ge 50\%$ or $P(\text{fraud}) \ge 0.50$ (immediate rejection, $60\% - 99\%$).

---

## 🏗️ System Architecture

```
PayGuard/
├── backend/                   # FastAPI Backend
│   ├── src/
│   │   ├── admin/             # Analytics, review queue, and audit trails
│   │   ├── auth/              # JWT auth and security dependencies
│   │   ├── core/              # Config, async SQLAlchemy database engine
│   │   ├── transactions/      # Predict, batch scan, router & service logic
│   │   └── main.py            # FastAPI factory, rate limiter, lifecycle hooks
│   └── requirements.txt
│
├── frontend/                  # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/        # iOS Liquid Glass UI cards, badges, logo, shell
│   │   ├── pages/             # Dashboard, BatchScan, History, ReviewQueue, Settings
│   │   └── index.css          # Design system tokens and glassmorphism styles
│   └── package.json
│
├── ml/                        # ML Engineering & Artifacts
│   ├── datasets/              # Dataset generators and feature vectors
│   ├── models/                # Serialized models (.pkl) & training_metrics.json
│   └── scripts/               # train.py, predict.py, evaluate.py, explain.py
│
└── docker-compose.yml         # Containerized production deployment
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* Python 3.12+
* Node.js 18+ & npm
* Git

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Client Application will run at: `http://localhost:5173`

### 3. Demo Credentials
* **Admin Login**: `admin@payguard.ai`
* **Password**: `Admin@12345`

---

## 🧪 Model Retraining & Evaluation

To re-run the end-to-end ML pipeline:

```bash
cd ml
pip install -r requirements.txt

# 1. Generate synthesized UPI transaction stream
python scripts/generate_dataset.py

# 2. Extract features and build enriched matrices
python scripts/feature_engineering.py

# 3. Train Isolation Forest and XGBoost with scale_pos_weight
python scripts/train.py

# 4. Generate evaluation plots (Confusion Matrix, ROC, Precision-Recall)
python scripts/evaluate.py
```
Evaluation visualizations will be generated in `ml/models/evaluation/`.

---

## 🔒 Security & Compliance
* **Asynchronous Database Sessions**: Built on SQLAlchemy AsyncIO with aiosqlite / asyncpg.
* **Rate Limiting**: Configured using SlowAPI to prevent denial-of-service and brute-force attacks on prediction endpoints.
* **Password Hashing**: Bcrypt with salted rounds.
* **Stateless Tokens**: JWT Bearer tokens with configurable expiration.

---

## 📜 License
Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
