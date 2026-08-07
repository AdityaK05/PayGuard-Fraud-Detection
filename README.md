# 🛡️ PayGuard AI – Enterprise Fraud Detection (Detailed README for Presentation)

## What this is (short)
PayGuard AI is a real-time UPI transaction monitoring system that detects and blocks fraudulent transactions using a hybrid ML pipeline (unsupervised anomaly detection + supervised scoring) and a polished FastAPI + React UI for demonstration.

---

## What this README adds
This expanded README documents the most important files you'll want to explain in a presentation:
- ML model artifacts and their purpose
- ML scripts (train / predict / evaluate / explain / preprocessing / feature engineering)
- Backend files that wire models into the API
- Frontend files to demonstrate the dashboard
- Dev/ops files useful for live demos (Docker, compose, env)
- Suggested talking points and a short demo script

---

## Top-level project structure (quick)
```
.env.example
docker-compose.yml
frontend/              # React + Vite frontend (TypeScript)
backend/               # FastAPI backend (Python)
ml/                    # Models, training & inferencing scripts, dataset helpers
LICENSE
README.md
```

---

## ML artifacts (ml/models)
Explain these files on a slide (what they are, why they matter):

- ml/models/IsolationForest.pkl
  - Purpose: Unsupervised anomaly detector producing an `anomaly_score` per transaction.
  - Talk points: Used to detect rare or outlier transaction patterns (velocity, unusual merchant/location). Useful to show "anomaly_score" visualized in the dashboard.

- ml/models/XGBoost.pkl
  - Purpose: Supervised classifier that outputs `fraud_probability` (0.0–1.0).
  - Talk points: Trained on labeled transactions; combines engineered features and the anomaly score. Good to show feature importances or a sample prediction.

- ml/models/Preprocessor.pkl
  - Purpose: Serialization of the feature transformation pipeline (categorical encoders, imputation, pipeline steps).
  - Talk points: Ensures training and inference use identical feature transforms.

- ml/models/Scaler.pkl
  - Purpose: Numeric feature scaler (e.g., StandardScaler) used to normalize numeric inputs.
  - Talk points: Explain why scaling matters for distance-based models and tree-based pipelines where consistent ranges simplify feature interactions.

- ml/models/Encoder.pkl
  - Purpose: Encodes categorical features (merchant categories, location buckets, etc.).
  - Talk points: Used to convert categories to numeric form (one-hot, ordinal, or target encoding depending on pipeline).

- ml/models/feature_columns.pkl
  - Purpose: Canonical list / order of features expected by the model.
  - Talk points: Useful to show the exact features the model uses and to verify alignment between frontend/backend/ML code.

- ml/models/training_metrics.json
  - Purpose: Training-time metrics (ROC AUC, precision, recall, thresholds) and possibly cross-validation stats.
  - Talk points: Use this to show model performance and to justify thresholds used by the decision engine.

---

## Important ML scripts (ml/scripts)
Each can be a slide with sample command(s):

- ml/scripts/generate_dataset.py
  - What: Builds or synthesizes the dataset used for training (parsing raw logs, labeling rules).
  - Use in demo: Show how the dataset was generated or a small sample of training rows.

- ml/scripts/preprocessing.py
  - What: Prepares raw transaction data (cleaning, imputation, time conversions).
  - Talk points: Show before/after examples (raw vs cleaned rows).

- ml/scripts/feature_engineering.py
  - What: Computes rolling and behavioral features (e.g., tx_velocity_1h, behavior_deviation, location_mismatch).
  - Talk points: Explain real-time feature computation: how historical transactions are aggregated and used for a single prediction.

- ml/scripts/train.py
  - What: Orchestrates training for the Isolation Forest and XGBoost models and saves artifacts to ml/models.
  - Sample run:
    ```bash
    cd ml
    python -m pip install -r requirements.txt
    python scripts/train.py --config config.yaml
    ```
  - Talk points: Mention hyperparameters, validation split, and artifact outputs.

- ml/scripts/evaluate.py
  - What: Runs evaluation on held-out data and writes metrics to training_metrics.json.
  - Talk points: Use for slides to show ROC curve, confusion matrix, precision@k.

- ml/scripts/predict.py
  - What: Lightweight CLI / script to load saved artifacts and perform a prediction on a supplied transaction JSON or CSV row.
  - Sample run:
    ```bash
    python scripts/predict.py --input sample_tx.json
    ```
  - Talk points: Use during demo to show a transaction going from raw -> features -> anomaly score -> fraud probability -> decision.

- ml/scripts/explain.py
  - What: Generates per-prediction explanations (SHAP) for the XGBoost model.
  - Talk points: Show a SHAP force plot or bar chart to justify why the model labeled a transaction risky.

---

## Backend (backend/src) — files to highlight
These are the files you'll reference when explaining how ML integrates with the API.

- backend/src/main.py
  - Role: FastAPI application factory, startup/shutdown lifecycle, DB initialization, ML model preloading (optional).
  - Quote to show on slide: It pre-loads ML models at startup via TransactionService._get_predictor() and registers routers for auth, users, transactions and admin.

- backend/src/core/config.py
  - Role: Centralized application settings (APP_NAME, APP_VERSION, DB URL, CORS origins, secret keys).
  - Talk points: Show how environment variables from .env.example map to runtime behavior.

- backend/src/core/database.py
  - Role: Database initialization (SQLite / SQLAlchemy models). Explain how historical transaction queries are executed to compute rolling features.

- backend/src/transactions/
  - Files: router, service, schemas, models (likely)
  - Role: TransactionService loads ML models, computes real-time features using DB queries, calls the predictor, applies decision engine (risk -> block/approve).
  - Talk points: Emphasize separation: Router (HTTP), Service (business logic + ML), DB models (persistence).

- backend/src/auth, backend/src/users, backend/src/admin
  - Role: Authentication, user management, and admin utilities (seed demo admin user).
  - Talk points: Show how auth protects sensitive endpoints and how admin routes can be used for seeding or model reloading (if implemented).

---

## Frontend (frontend/) — files to highlight in presentation
- frontend/src/
  - Role: React components and pages for the dashboard. Show the real-time transaction feed, detail modal with model explanation, and charts.

- frontend/index.html & public/
  - Role: Static assets and demo screenshots used in the presentation.

- frontend/package.json, vite.config.ts
  - Role: Build/run scripts for the demo. Explain how to run locally (npm install && npm run dev).

- What to demo on screen:
  - The real-time dashboard (transactions stream)
  - A single transaction detail view showing:
    - anomaly_score
    - fraud_probability
    - SHAP explanation (from explain.py / backend explain endpoint if wired up)
  - Use the sample transaction generator to create suspicious / benign transactions.

---

## Dev / Ops & Demo helpers
- docker-compose.yml
  - Role: Compose file to run backend + frontend (and DB) for a reproducible demo.
  - Demo tip: Use docker-compose up to show a quick, stable demo environment.

- backend/Dockerfile, frontend/Dockerfile
  - Role: Container definitions for production-like demo.

- .env.example
  - Role: Example environment variables (DB path, secret keys, model reload flags).
  - Demo tip: Show which variables are important for demo mode (e.g., seeding admin user, enabling dev logging).

- backend/requirements.txt, ml/requirements.txt, frontend/package.json
  - Role: Reproducible dependency lists. Mention major libraries (FastAPI, SQLAlchemy, XGBoost, scikit-learn, SHAP, React, Vite).

---

## How to run a short local demo (commands)
1. Start backend:
```bash
cd backend
python -m venv .venv
# activate venv...
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000
```

2. Start frontend:
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

3. (Optional) Run a local prediction using the ML CLI:
```bash
cd ml
python -m pip install -r requirements.txt
python scripts/predict.py --input example_tx.json
```

4. (Optional) Use docker-compose for combined demo:
```bash
docker-compose up --build
```

---

## Presentation talking points (slide-by-slide suggestions)
1. Problem + Impact (why UPI fraud detection matters)
2. Architecture diagram (frontend, backend, ML pipeline, DB)
3. ML pipeline overview (feature engineering → isolation forest → XGBoost → decision engine)
4. Artifact slide: show each file in ml/models and explain its role (Encoder, Scaler, Preprocessor, IsolationForest, XGBoost)
5. Training & Metrics: show training_metrics.json and sample ROC / precision recall
6. Explainability: show an explain.py output (SHAP) and how that appears in the UI
7. Live demo: start backend + frontend, push a sample transaction, show model outputs and decision
8. Ops: docker-compose, env, and how to reload models in production (if applicable)

---

## Short demo script (3–5 minutes)
- Start servers (2 min)
- Trigger a high-risk transaction via ML CLI or frontend (30s)
- Show the dashboard transaction detail: anomaly_score, fraud_probability, SHAP explanation (1 min)
- Summarize decision threshold and how false positives are handled (30s)

---

## Slide resource checklist (files to include in slides)
- ml/models/training_metrics.json (metrics slide)
- ml/scripts/explain.py output (explainability slide)
- ml/models/feature_columns.pkl (feature list)
- backend/src/main.py (architectural slide, lifecycle & model preload)
- docker-compose.yml (ops & reproducibility slide)
- Frontend screenshots from frontend/public (UI slide)

---

## Final notes for the presenter
- When discussing models, emphasize both components: the Isolation Forest (captures anomalies) and the XGBoost model (predicts probability conditioned on engineered features).
- Demonstrate one benign and one malicious-looking transaction so audience sees how the anomaly score and fraud probability behave differently.
- If asked about model updates: mention retraining via ml/scripts/train.py and redeploying artifacts in ml/models (or creating a model-reload endpoint in admin routes).

---

Made with ❤️ — Use this README to replace or augment the repository README so your presentation has clear, file-level explanations and an actionable demo plan.
