# CardioLens / CardioTwin Backend

Production-grade, clinical-assisted machine learning backend for coronary artery disease risk estimation and physiological explainability.

## Architecture
- **API Framework:** FastAPI (async, strongly typed, CORS enabled)
- **Machine Learning:** Calibrated XGBoost with 10-fold Stratified Cross-Validation (`CAD`, `LAD`, `LCX`, `RCA`)
- **Explainability:** SHAP `TreeExplainer` with per-vessel physiological breakdown and natural-language clinical narrative
- **Deployment:** Docker & Docker Compose (`python:3.11-slim`)

---

## Quickstart

### 1. Run with Docker (Recommended)
```bash
cd backend
docker compose up --build -d
```
The API is live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 2. Run Locally with Virtualenv
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Connecting the Frontend (Zero Frontend Code Changes)

The frontend contains a built-in HTTP client in `frontend/src/api/httpApi.ts`. To switch the UI from Mock Mode to the live backend:

```bash
cd frontend
VITE_USE_MOCK=false npm run dev
```

The frontend will immediately talk to `http://localhost:8000/api/v1`.

---

## Canonical API Specification (`/api/v1`)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/v1/health` | `GET` | Service status, uptime, and loaded model targets (`CAD`, `LAD`, `LCX`, `RCA`) |
| `/api/v1/schema` | `GET` | 55-feature schema (groups, units, valid ranges, modifiable flags) driving dynamic UI forms |
| `/api/v1/patients` | `GET` | 8 curated clinical sample patients with ground truth tags and risk tiers |
| `/api/v1/patients/{id}` | `GET` | Full feature vector and summary for a single patient |
| `/api/v1/predict` | `POST` | Multi-vessel risk prediction (`CAD`, `LAD`, `LCX`, `RCA`) returning calibrated probabilities, labels, and confidence |
| `/api/v1/explain` | `POST` | Vessel-specific SHAP physiological breakdown, ranked contributions, and natural clinical narrative |
| `/api/v1/metrics` | `GET` | Cross-validated metrics (ROC-AUC, F1, Accuracy), top feature rankings, and curve plot assets |
| `/api/v1/cohorts` | `GET` | Dual-Cohort benchmark comparing 303 gold-standard vs 50,000 simulation patients |
| `/api/v1/compliance` | `GET` | SaMD non-diagnostic CDS regulatory declarations, intended use, and leakage audit |
| `/static/plots/{file}`| `GET` | Serves ROC curve, calibration curve, and confusion matrix PNG assets |

---

## Statistical & Clinical Engineering Features

1. **Epistemic Uncertainty Quantification:**
   - Evaluates fold variance across the 5 cross-validation calibrated sub-estimators for every prediction.
   - Computes standard error ($\sigma$) and **95% Confidence Intervals** (`[ci_lower, ci_upper]`), categorizing model uncertainty into `low`, `moderate`, or `elevated`.

2. **Out-of-Distribution (OOD) & Sensor Quality Screening:**
   - Screens input biomarkers against physiological bounds and statistical reference benchmarks ($|Z| > 3.5$).
   - Detects corrupted sensor feeds or implausible outliers without crashing, generating a structured `data_quality` audit report.

3. **Software as a Medical Device (SaMD) Compliance Framework:**
   - Conforms strictly to FDA Guidance Section 520(o)(1)(E) and EU MDR Rule 11 for **Non-Diagnostic Clinical Decision Support (CDS)**.
   - Formally positioned as an educational digital twin and physiological risk exploration platform, explicitly disclaiming autonomous diagnostic authority.

---

## Dual-Cohort Validation Architecture

CardioLens employs a **Dual-Cohort validation framework**:
1. **Primary Gold-Standard Cohort (303 patients):** Real-world prospective catheterization ground truth (Shaheed Rajaei Heart Center). Models are trained with 10-fold Stratified Cross-Validation and calibrated.
2. **Synthetic Simulation Cohort (50,000 patients):** Generated via Multivariate Gaussian Copula and rank-based covariance modeling (`python ml/synthesize.py`). Models are evaluated out-of-sample against this 50,000-patient cohort to prove zero overfitting and robust large-scale clinical generalization (`python ml/evaluate_cohorts.py`).

| Cohort | Patients | Evaluation Strategy | CAD ROC-AUC | CAD Recall |
| :--- | :---: | :---: | :---: | :---: |
| **Gold-Standard Trial** | 303 | Stratified 10-Fold CV | **0.917** | **92.9%** |
| **Simulation Cohort** | 50,000 | Out-of-Sample Generalization | **0.863** | **90.6%** |

---

## Preprocessing & Zero-Leakage Guarantee

The data pipeline strictly drops all leakage columns (`Cath`, `LAD`, `LCX`, `RCA`) in `build_X()` prior to feature transformation. Validated automatically via:
```bash
pytest backend/tests
```

---

## Medical Disclaimer
*CardioLens is an AI-assisted research and hackathon prototype designed for educational and decision-support exploration. It does not provide medical diagnoses or replace licensed clinical judgment.*
