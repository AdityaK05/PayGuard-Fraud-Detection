# 🧪 PayGuard — Test Cases & Error Handling Specification

This document provides a comprehensive test matrix based on synthetic data and real-world banking statement patterns from [`mock-1.pdf`](file:///d:/PayGuard/mock-1.pdf) and [`mock-2.pdf`](file:///d:/PayGuard/mock-2.pdf), covering legitimate transactions, security threats, anomalous spending, and operational error scenarios.

---

## 📋 Comprehensive Test Matrix

| Test Case ID | Test Scenario & Source | Input Parameters (Mock Data) | Error / Anomaly Condition | How It Is Handled | Detection Mechanism | Output & Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Legitimate Micro-Payment**<br>`mock-1.pdf` (Page 1) | **Amount**: ₹684.50<br>**Merchant**: Swiggy Food<br>**Category**: `food_delivery`<br>**Time**: 09:12 AM (Daytime)<br>**Device**: Android 14 / Trusted IP | None (Normal baseline pattern within expected category limits). | Validated against historical user velocity; Isolation Forest assigns positive anomaly score (+0.0636). XGBoost assigns baseline probability (~0.009). | Preprocessor + Isolation Forest + XGBoost | **Score: 5%**<br>`APPROVED`<br>HTTP 200 OK |
| **TC-02** | **Scheduled Utility Bill**<br>`mock-1.pdf` (Page 1) | **Amount**: ₹1,742.00<br>**Merchant**: BESCOM Electricity<br>**Category**: `utilities`<br>**Time**: 06:22 PM<br>**Mode**: Bill Payment | Normal utility payment (low deviation from category mean ₹2,000). | Matches typical billing frequencies and merchant verified list; no anomalous flags triggered. | Feature Engineering + XGBoost | **Score: 5%**<br>`APPROVED`<br>HTTP 200 OK |
| **TC-03** | **Nocturnal Crypto Drain**<br>`mock-1.pdf` (Page 1 & 2) | **Amount**: ₹9,50,000.00<br>**Merchant**: Offshore Crypto Exchange<br>**Category**: `crypto`<br>**Time**: 03:14 AM (Late Night)<br>**IP**: Untrusted Foreign (Dubai) | **Severe Anomaly**: Amount exceeds normal baseline by 19x at 3:14 AM via new web browser on untrusted offshore IP. | Isolation Forest detects space isolation (`anomaly_score: -0.0534`); XGBoost yields `P(fraud) = 0.9935`. Risk engine applies +4% night penalty, +6% foreign IP penalty, and caps score at 99%. | Dual ML Engine + TreeSHAP + Continuous Risk Calibrator | **Score: 99%**<br>`BLOCKED`<br>HTTP 200 OK (Decision: Blocked) |
| **TC-04** | **High-Value Offshore Wire Transfer**<br>`mock-1.pdf` (Page 1 & 2) | **Amount**: ₹8,75,000.00<br>**Merchant**: Northstar Trading<br>**Category**: `real_estate`<br>**Time**: 03:02 AM<br>**IP**: 194.26.29.11 (Untrusted) | **Geographic & Velocity Mismatch**: Sudden burst wire transfer across international jurisdiction outside normal hours. | Multi-factor engine flags category mean violation and IP change (`is_new_ip: 1`, `is_late_night: 1`). Triggers immediate blocking before funds exit account. | Anomaly Detector + Geographic Profiler | **Score: 99%**<br>`BLOCKED`<br>HTTP 200 OK (Decision: Blocked) |
| **TC-05** | **Midnight Luxury Jewel Spree**<br>`mock-2.pdf` (Page 1) | **Amount**: ₹11,40,000.00<br>**Merchant**: Milan Jewel House<br>**Category**: `jewellery`<br>**Time**: 02:47 AM<br>**Device**: Web / Windows | **Out-of-Profile Spend**: Single luxury transaction 500x greater than average account transaction size. | TreeSHAP identifies `amount_vs_category_avg` and `anomaly_score` as primary risk drivers. Hard stop threshold ($\ge 50\%$) triggered. | Supervised Classifier + TreeSHAP Attributions | **Score: 99%**<br>`BLOCKED`<br>HTTP 200 OK (Decision: Blocked) |
| **TC-06** | **Borderline High-Value Contact Transfer**<br>Simulated P2P | **Amount**: ₹26,500.00<br>**Merchant**: Peer-to-Peer Transfer<br>**Category**: `p2p`<br>**Time**: 11:45 PM<br>**Device**: Android / Local IP | **Elevated Suspicion**: High-value P2P transfer late at night, but from a trusted local device. | Risk score falls in intermediate zone (25%–49%). System does not hard-block; routes transaction to Compliance Review Queue for manual or 2FA verification. | Threshold Governance Engine | **Score: 49%**<br>`REVIEW`<br>HTTP 200 OK (Action: Flagged) |
| **TC-07** | **Malformed / Unsupported Document Upload**<br>Batch Scanner | **File**: Invalid `.txt` / `.exe` or corrupted PDF statement without recognizable amount patterns. | **Parsing Error**: Document missing valid currency symbols (`₹`, `Rs`, `INR`) or contains empty records. | Frontend `handleFile` validates extension and structure; if parsing yields zero records, stops pipeline, displays error alert toast, and prevents backend submission. | PDF.js Parser + Client-Side Validation | `Error Toast`: *"No valid transaction records detected"* (Client-side handled) |
| **TC-08** | **Payload Schema Validation Error**<br>API Endpoint `/predict` | **Payload**: `{"amount": -500, "merchant_category": ""}` (Negative amount, missing required fields). | **Client Schema Violation**: Invalid request body violating OpenAPI contract. | Pydantic model (`TransactionCreate`) rejects payload before reaching the database or ML layer; returns structured error details. | FastAPI Request Validation (Pydantic v2) | HTTP 422 Unprocessable Entity |
| **TC-09** | **API Rate Limit Burst / DoS Attack**<br>API Endpoint `/predict` | **Load**: $>60$ rapid requests within a 60-second window from a single IP/token. | **Service Overload Threat**: Malicious actor attempting to overwhelm ML inference workers. | SlowAPI interceptor catches excess requests; rejects them with standard rate-limiting headers (`Retry-After`). Underlying ML process remains protected. | SlowAPI Rate Limiter | HTTP 429 Too Many Requests |
| **TC-10** | **Database Failure during Batch Processing**<br>API `/predict/batch` | **Input**: Valid batch of 50 transactions, but database connection drops midway. | **Persistence Error**: Failure during batch database insert/commit. | Wrapped in `try...except` block in `batch_predict`; executes `await self.db.rollback()`. Prevents corrupt partial records from entering ledger. | Transactional Unit-of-Work (SQLAlchemy) | HTTP 500 / Handled Rollback with System Log |

---

## 🔍 Detailed Error Handling Mechanisms

### 1. Model Inference Anomalies (Low vs. High Risk)
* **Legitimate Transactions (TC-01, TC-02)**:
  * Isolation Forest outputs a positive distance score ($> 0$, typically $+0.05$ to $+0.12$).
  * Calibrated risk score yields $2\% - 10\%$, safely under the $25\%$ review threshold.
  * System immediately marks the transaction status as `approved`.
* **Severe Financial Attacks (TC-03, TC-04, TC-05)**:
  * Isolation Forest outputs negative scores ($\approx -0.03$ to $-0.06$).
  * XGBoost probability spikes above $0.90$.
  * Calibrated risk formula factors in amount exposure ($\log_{10}(\text{amount})$), night penalty ($+4\%$), and untrusted IP ($+6\%$).
  * Score hits $95\% - 99\%$, exceeding the $50\%$ block threshold. Status marked as `blocked`.

### 2. Ambiguous & Borderline Cases (TC-06)
* When risk falls in the gray zone between $25\%$ and $49\%$, PayGuard avoids false-positive friction by routing the transaction to the **Review Queue** (`review_queue.tsx` / `backend/src/admin/router.py`) rather than denying the transaction outright.

### 3. Client & File Ingestion Errors (TC-07)
* Client-side validation in [`BatchScanPage.tsx`](file:///d:/PayGuard/frontend/src/pages/BatchScanPage.tsx) checks file extensions (`.csv`, `.pdf`).
* In case of empty or corrupt tables, parsing gracefully halts and displays user-friendly error banners without crashing the UI.

### 4. API & Network Fault Tolerance (TC-08, TC-09, TC-10)
* **Schema Protection**: Type enforcement and boundary checks via Pydantic (`amount > 0`).
* **Rate Limiting**: Configured at `60/minute` on `/predict` to prevent brute-force attacks.
* **Transactional Integrity**: All multi-statement transactions are wrapped in atomic database sessions with explicit rollback handlers.

