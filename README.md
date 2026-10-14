# CardioLens / CardioTwin 🫀

> **Interactive 3D Digital Twin for Coronary Artery Disease (CAD) Detection & Per-Vessel Risk Localization**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-black.svg)](https://threejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow.svg)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-orange.svg)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ⚡ Architecture: Zero-Latency Client-Side Inference

> **"Models trained + cross-validated in Python (`backend/`), exported to static artifacts, served via client-side inference for a zero-latency, always-on web app. No runtime server required."**

CardioLens bridges high-fidelity clinical machine learning with real-time web graphics:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OFFLINE / REPRODUCIBILITY                       │
│                                                                        │
│  backend/data/z_alizadeh_sani.csv (303 patients, 55 clean features)   │
│                                 │                                      │
│                                 ▼                                      │
│               Target Leakage Guard (test_leakage.py)                  │
│                [LAD, LCX, RCA, Cath strictly dropped]                  │
│                                 │                                      │
│                                 ▼                                      │
│            10-Fold Stratified Cross-Validation (train.py)              │
│            [Calibrated LR vs. Random Forest vs. XGBoost]               │
│                                 │                                      │
│                                 ▼                                      │
│       Static Artifacts Exporter (backend/ml/train_and_export.py)       │
│     Transforms, coefficients, scalers, schema & calibration lookup     │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ Static JSON files
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     RUNTIME / ZERO-LATENCY DEPLOYMENT                  │
│                                                                        │
│                      frontend/public/model/                            │
│           ├── feature_schema.json       ├── cad.json                   │
│           ├── population_reference.json ├── lad.json                   │
│           ├── metrics.json              ├── lcx.json                   │
│           └── plots/*.png               └── rca.json                   │
│                                 │                                      │
│                                 ▼                                      │
│          In-Browser ML Engine (src/api/localInferenceApi.ts)           │
│                                 │                                      │
│   • Exact Preprocessing: One-hot encoding & StandardScaler             │
│   • Exact Linear Logit: z = Σ(w_i · x_i) + b                           │
│   • Isotonic / Sigmoid Probability Calibration                         │
│   • Closed-Form SHAP Explanations: φ_i = w_i · x_i_standardized        │
│   • Sub-2ms execution time per patient with 0 network calls            │
│                                 │                                      │
│                                 ▼                                      │
│                 Interactive 3D Heart & Digital Twin                    │
│   Real-time stenosis risk glow, hemodynamic pulses, What-If slider     │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Zero Runtime Dependency**: The web application deploys as pure static assets (e.g., GitHub Pages, Vercel, Netlify, Cloudflare Pages). No Python server, container orchestration, or API latency at runtime.
2. **Sub-2ms Inference**: Full multi-target prediction (Overall CAD, LAD stenosis, LCX stenosis, RCA stenosis) plus exact per-vessel SHAP feature attributions execute in under 2 milliseconds directly in the browser thread.
3. **Privacy & Offline First**: Patient health data never leaves the browser. Calculations occur locally in memory.
4. **Reproducibility Guarantee**: The `backend/` pipeline fully reproduces the artifacts from the raw dataset, and automated unit tests verify mathematical parity between Python `scikit-learn` and JavaScript in-browser inference to machine precision ($< 10^{-15}$).

---

## 📁 Monorepo Structure

```
CardioLens/
├── frontend/                     # Deployable client-side web application
│   ├── public/
│   │   ├── model/                # Exported static ML artifacts
│   │   │   ├── feature_schema.json       # 55 features taxonomy, types, ranges
│   │   │   ├── population_reference.json # Baseline distributions for SHAP
│   │   │   ├── metrics.json              # 10-fold CV performance across models
│   │   │   ├── cad.json, lad.json, ...   # Weights, intercepts, scalers
│   │   │   └── plots/                    # ROC, Calibration & Confusion plots
│   │   └── models/               # 3D GLTF/GLB heart geometry
│   ├── src/
│   │   ├── api/
│   │   │   ├── localInferenceApi.ts      # Real in-browser ML inference & SHAP
│   │   │   ├── types.ts                  # Shared domain & patient types
│   │   │   └── index.ts                  # API factory selector
│   │   ├── components/
│   │   │   ├── dashboard/                # Minimal HUD, SHAP waterfall, slide-over
│   │   │   ├── patient/                  # 55-feature accordion & sample selector
│   │   │   ├── trust/                    # Model Trust: ROC, Calibration, Matrices
│   │   │   ├── views/                    # Split View (3D ↔ 2D), Anatomy, Metrics
│   │   │   └── whatif/                   # Real-time What-If digital twin
│   │   ├── three/                        # React Three Fiber 3D heart & angiogram
│   │   ├── audio/                        # Web Audio S1/S2 Lub-Dub auscultation
│   │   └── store/                        # Zustand global application state
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Training & reproducibility deliverable
│   ├── data/
│   │   ├── z_alizadeh_sani.csv   # Canonical 303-patient dataset (55 features)
│   │   └── prepare_data.py       # Ingests & cleans UCI dataset 411
│   ├── ml/
│   │   └── train_and_export.py   # 10-fold CV training, evaluation & artifact export
│   ├── tests/
│   │   ├── test_leakage.py       # Strict target leakage prevention guard
│   │   └── test_export_faithfulness.py # Sklearn vs. JS mathematical parity (<1e-15)
│   └── requirements.txt          # Python dependencies for retraining
│
├── docs/                         # Specifications & clinical documentation
│   ├── PRD_Master.md             # Master specification
│   ├── PRD_Frontend.md           # UI/UX & 3D visualization requirements
│   └── PRD_Backend.md            # ML methodology & leakage constraints
│
├── package.json                  # Root monorepo workspace scripts
└── README.md                     # You are here
```

---

## 📊 Model Performance & Cross-Validation

All models are evaluated using **Stratified 10-Fold Cross-Validation** on the 303-patient Z-Alizadeh Sani cohort using strictly non-leakage clinical features:

| Target | Calibrated Logistic Regression (Served) | Random Forest | XGBoost | Best Tree Δ | Selection Rationale |
|:---|:---:|:---:|:---:|:---:|:---|
| **CAD (Overall)** | **0.925 ± 0.061** | 0.928 ± 0.055 | 0.899 ± 0.074 | +0.003 | Parity holds ($\le 0.03$). Calibrated LR delivers exact closed-form SHAP. |
| **LAD Stenosis** | **0.825 ± 0.071** | 0.852 ± 0.083 | 0.823 ± 0.092 | +0.027 | Parity holds ($\le 0.03$). Excellent discrimination for critical anterior descending artery. |
| **LCX Stenosis** | **0.716 ± 0.097** | 0.728 ± 0.109 | 0.764 ± 0.084 | +0.048 | Calibrated LR chosen for unified client-side inference & explainability architecture. |
| **RCA Stenosis** | **0.736 ± 0.050** | 0.707 ± 0.084 | 0.687 ± 0.078 | -0.028 | Calibrated LR outperforms tree models by +0.028 AUC. |

### Target Leakage Prevention Guard

As required by clinical safety standards, **post-catheterization findings (`LAD`, `LCX`, `RCA`, and `Cath`) are strictly excluded** from the input feature set $\mathbf{X}$ during both training and evaluation. Automated regression test `test_leakage.py` strictly enforces this barrier.

---

## 🚀 Quickstart: Frontend (Deployable Web App)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install Dependencies
```bash
npm --prefix frontend install
```

### 2. Run Local Development Server
```bash
npm run dev
# or: npm --prefix frontend run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app runs with real in-browser ML inference enabled by default (`VITE_USE_MOCK=false`).

### 3. Build for Production
```bash
npm run build
# or: npm --prefix frontend run build
```
Generates a zero-server static deployment in `frontend/dist/`.

---

## 🔬 Quickstart: Backend (Retraining & Reproducibility)

### Prerequisites
- Python 3.10+
- `pip`

### 1. Set Up Python Environment
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 2. Retrain Models & Re-export Static Artifacts
```bash
python backend/ml/train_and_export.py
```
This script:
1. Loads `backend/data/z_alizadeh_sani.csv` (303 rows, 55 clean features).
2. Verifies zero target leakage.
3. Performs Stratified 10-Fold CV across Calibrated LR, Random Forest, and XGBoost.
4. Generates performance plots (ROC curves, calibration curves, confusion matrices, model comparison bar chart) in `frontend/public/model/plots/`.
5. Exports production JSON models (`cad.json`, `lad.json`, `lcx.json`, `rca.json`, `models.json`), `feature_schema.json`, and `metrics.json` directly into `frontend/public/model/`.

### 3. Run Automated Verification Tests
```bash
pytest backend/tests/ -v
```
- **`test_leakage.py`**: Asserts that `LAD`, `LCX`, `RCA`, and `Cath` are never present in $\mathbf{X}$, and that exactly 55 clean features are preserved.
- **`test_export_faithfulness.py`**: Evaluates 5 sample patients through both Python `scikit-learn` and a simulated JavaScript inference engine, verifying mathematical parity to machine precision:
  $$\max |P_{\text{sklearn}} - P_{\text{js}}| < 10^{-15}$$

---

## 🩺 Clinical Features & Digital Twin Highlights

- **Clickable 3D Heart & Coronary Tree**: Real-time WebGL rendering with physics-based blood flow particles, per-vessel occlusion glows, and anatomical camera presets (Anterior, Posterior, LAO, RAO, Apex).
- **Fluoroscopic Angiogram Mode**: Smoky-glass cardiac transition with contrast dye bloom, lesion-choked hemodynamics, and realistic Web Audio auscultation (68 BPM Lub-Dub rhythm).
- **Synchronized Split View**: Side-by-side 3D Heart $\leftrightarrow$ 2D Coronary Tree Map with bidirectional segment selection and vessel-specific risk badges.
- **Dynamic Patient Input Rail**: 55-feature collapsible clinical accordion with instant validation, risk flags, and one-click sample patient loading.
- **Live What-If Digital Twin**: Real-time slider interventions (e.g. lowering BP, stopping smoking, improving HDL) with instantaneous risk recalculation and delta badges.
- **Model Trust & Governance**: Transparent model performance drawer featuring ROC-AUC curves, Brier calibration curves, confusion matrices, and feature importance waterfalls.

---

## ⚖️ Clinical Safety Disclaimer

**CardioLens is a clinical decision-support and investigational prototype (Class II SaMD).** It is intended to assist clinicians in contextualizing pre-catheterization risk and must not replace professional clinical judgment, standard diagnostic protocols, or invasive coronary angiography. Always consult certified medical practitioners for patient diagnosis and treatment decisions.
