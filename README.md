<div align="center">
  <img src="https://raw.githubusercontent.com/AdityaK05/PayGuard-Fraud-Detection/main/frontend/public/auth_background.png" alt="PayGuard AI" width="100%" style="border-radius: 20px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);" />

  <br />
  <br />

  # 🛡️ PayGuard AI – Enterprise Fraud Detection

  **Real-Time, Machine Learning-Powered UPI Transaction Monitoring**

  [![React](https://img.shields.io/badge/React-18.2-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![XGBoost](https://img.shields.io/badge/XGBoost-2.0.3-orange.svg?style=for-the-badge&logo=xgboost)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](#)
</div>

<br />

## 🌟 Overview

PayGuard AI is an end-to-end, real-time transaction monitoring system designed to detect and block fraudulent UPI payments in milliseconds. By leveraging a hybrid Machine Learning pipeline (Isolation Forests for anomaly detection and XGBoost for supervised fraud probability), it adapts to evolving threats while providing explainable AI (XAI) insights via SHAP.

### ✨ Key Features
- **⚡ Real-Time ML Inference**: Sub-50ms predictions combining supervised and unsupervised learning.
- **🧠 Dynamic Feature Engineering**: Resolves the "Cold Start Problem" by querying the SQLite database in real-time to compute historical user behavioral deviations, transaction velocity, and geographic anomalies.
- **🎨 Glassmorphic UI**: A premium, highly responsive React dashboard built with TailwindCSS and Framer Motion micro-animations.
- **🛡️ Secure Backend**: FastAPI backend with robust Pydantic validation, JWT authentication, and robust CORS management.

---

## 🏗️ System Architecture

PayGuard AI is built on a modern, decoupled architecture:

```mermaid
graph LR
    subgraph Frontend [React + Vite]
        UI[Glassmorphic UI]
        Dash[Real-Time Dashboard]
        Tx[New Transaction Form]
    end

    subgraph Backend [FastAPI]
        API[REST API Router]
        Auth[JWT Security]
        Svc[Transaction Service]
    end

    subgraph ML_Pipeline [Machine Learning]
        FE[Feature Engineer]
        ISO[Isolation Forest]
        XGB[XGBoost]
    end
    
    subgraph Storage [Database]
        SQL[(SQLite / PostgreSQL)]
    end

    UI <-->|Axios / REST| API
    API --> Auth
    API --> Svc
    Svc <-->|Read/Write History| SQL
    Svc --> FE
    FE --> ISO
    ISO --> XGB
    XGB --> Svc
```

### 🧠 The ML Pipeline
1. **Data Preprocessing**: Standardizes numeric features and applies one-hot encoding to categorical variables (e.g., Merchant Category).
2. **Feature Engineering (Real-Time)**: Fetches the user's last 50 transactions from the database to calculate rolling features (`tx_velocity_1h`, `behavior_deviation`, `location_mismatch`).
3. **Isolation Forest**: Generates an unsupervised `anomaly_score` for the enriched feature set.
4. **XGBoost**: Takes the enriched features + anomaly score to output a definitive `fraud_probability` (0.0 to 1.0).
5. **Decision Engine**: Calculates a blended Risk Score (0-100) and executes an `approved` or `blocked` decision.

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/AdityaK05/PayGuard-Fraud-Detection.git
cd PayGuard-Fraud-Detection
```

### 2️⃣ Start the Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# Activate venv: .\.venv\Scripts\activate (Windows) or source .venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000
```
*Note: A demo admin user will be seeded automatically on first run (`admin@payguard.ai` / `admin123!`).*

### 3️⃣ Start the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to view the dashboard!

---

## 📸 Dashboard Preview

*A beautifully animated, dark-mode glass UI built for financial analysts.*

<div align="center">
  <img src="https://raw.githubusercontent.com/AdityaK05/PayGuard-Fraud-Detection/main/frontend/public/auth_background.png" alt="Dashboard Preview" width="80%" style="border-radius: 12px; border: 1px solid #333;" />
</div>

<br/>

## 🛠️ Technology Stack

| Domain | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Recharts, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic, Passlib, Uvicorn |
| **Machine Learning** | Scikit-Learn (Isolation Forest), XGBoost, Pandas, SHAP |
| **Database** | SQLite (Development) |

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/AdityaK05">AdityaK05</a>
</div>
