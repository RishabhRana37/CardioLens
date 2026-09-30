# CardioTwin — Backend PRD

> **Scope:** ML pipeline, model training/serving, explainability, and the REST API for CardioTwin (Track A).
> **Parent:** `PRD_Master.md` · **Sibling:** `PRD_Frontend.md`
> **Stack:** Python 3.11 · FastAPI · scikit-learn · XGBoost/LightGBM · imbalanced-learn · SHAP · joblib · Docker
> **Owner:** Rishabh Rana · **Status:** v1.0 build spec

---

## 1. Backend responsibilities

1. Ingest + preprocess the Extension of Z-Alizadeh Sani dataset (**leakage-safe**).
2. Train and persist **4 classifiers**: overall `CAD`, and per-vessel `LAD`, `LCX`, `RCA` stenosis.
3. Evaluate rigorously (accuracy, precision, recall, F1, ROC-AUC) with stratified 10-fold CV; export metrics + curves.
4. Produce **SHAP** explanations per target (global + per-instance).
5. Serve everything via a typed REST API that the frontend consumes.
6. Be **reproducible** (fixed seeds, pinned deps, one-command run) and **extensible** (config-driven feature list + model registry).

---

## 2. Dataset spec (authoritative)

- **Source:** UCI / Kaggle / Mendeley — *Extension of Z-Alizadeh Sani* (adds LAD, LCX, RCA labels).
- **Rows:** 303 patients · **Features:** ~55 · **Missing values:** none.
- **Overall CAD balance:** ~216 CAD / ~87 Normal (imbalanced ≈ 71/29).
- **Stenosis definition:** a vessel is *Stenotic* if diameter narrowing ≥ 50%.

### 2.1 Feature groups & columns (build the schema from this)

> Names vary slightly across CSV mirrors (e.g., `DLP`/`Dyslipidemia`, `Length`/`Height`, `BP`/`Blood Pressure`). Normalize to the canonical names below in a rename map; **do not** hand-key column order — read from a config.

**Demographic (categorical unless noted numeric):**
`Age`(num), `Weight`(num), `Height/Length`(num), `Sex`, `BMI`(num), `DM` (diabetes), `HTN` (hypertension), `Current Smoker`, `Ex-Smoker`, `FH` (family history), `Obesity`, `CRF` (chronic renal failure), `CVA` (cerebrovascular accident), `Airway disease`, `Thyroid Disease`, `CHF` (congestive heart failure), `DLP` (dyslipidemia).

**Symptom & examination:**
`BP`(num, mmHg), `PR`(num, bpm), `Edema`, `Weak Peripheral Pulse`, `Lung rales`, `Systolic Murmur`, `Diastolic Murmur`, `Typical Chest Pain`, `Dyspnea`, `Function Class`(ordinal 0–4), `Atypical`, `Nonanginal CP`, `Exertional CP`, `LowTH Ang` (low-threshold angina).

**ECG:**
`Rhythm`(categorical), `Q Wave`, `ST Elevation`, `ST Depression`, `T inversion`, `LVH` (left ventricular hypertrophy), `Poor R Progression`.

**Laboratory & echo (numeric unless noted):**
`FBS`, `Cr` (creatinine), `TG`, `LDL`, `HDL`, `BUN`, `ESR`, `HB`, `K`, `Na`, `WBC`, `Lymph`, `Neut`, `PLT`, `EF-TTE` (ejection fraction), `Region with RWMA`(ordinal 0–4), `VHD` (valvular heart disease: Normal/Mild/Moderate/Severe).

### 2.2 Targets

| Target key | Source column | Classes | Notes |
|---|---|---|---|
| `CAD` | `Cath` (Result of angiography) | `CAD` / `Normal` | overall |
| `LAD` | `LAD` | `Stenotic` / `Normal` | per-vessel |
| `LCX` | `LCX` | `Stenotic` / `Normal` | per-vessel |
| `RCA` | `RCA` | `Stenotic` / `Normal` | per-vessel |

### 2.3 ⚠️ Target-leakage rule (Requirement 1d — do NOT get this wrong)

> The dataset authors and the Track A brief both state it: **`LAD`, `LCX`, `RCA`, and `Cath` must be excluded from the input feature set** for every prediction. CAD is defined *from* these, so leaving any in = target leakage = inflated, invalid scores.

**Implementation contract:**
```python
LEAKAGE_COLUMNS = ["LAD", "LCX", "RCA", "Cath"]   # never in X, for ANY target

def build_X(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop(columns=LEAKAGE_COLUMNS, errors="raise")
```
**Automated guard (must be a passing test):**
```python
def test_no_leakage():
    X = build_X(load_raw())
    assert not (set(LEAKAGE_COLUMNS) & set(X.columns)), "LEAKAGE: forbidden target col in X"
```
Every model — including the per-vessel ones — trains on the **same** leakage-free `X`. The only thing that changes between models is `y`.

---

## 3. Preprocessing pipeline

Use a single scikit-learn `ColumnTransformer` inside a `Pipeline` so preprocessing is fit on train folds only (prevents CV leakage too).

1. **Load + rename** columns to canonical names (config-driven map).
2. **Drop leakage columns** (`build_X`).
3. **Type split:** numeric vs categorical vs ordinal (from `features.yaml`).
4. **Encode:**
   - Binary Y/N → {1,0}; `Sex` (Male/Female) → {1,0}.
   - Nominal categoricals (`Rhythm`, `VHD`) → OneHotEncoder(handle_unknown="ignore").
   - Ordinals (`Function Class`, `Region with RWMA`) → kept as integers.
5. **Scale:** StandardScaler on numeric (needed for LogReg; harmless for trees).
6. **Derived (optional, documented):** `Obesity` is derivable from `BMI`; keep as-is to match source. Do **not** invent features that aren't clinically grounded.
7. **Class imbalance:** handle **inside CV** — `class_weight="balanced"` (LogReg/RF) or `scale_pos_weight` (XGB); optionally SMOTE via `imblearn.Pipeline` applied to **train folds only**.

**Config example (`features.yaml`) — drives NFR2 extensibility:**
```yaml
numeric: [Age, Weight, Height, BMI, BP, PR, FBS, Cr, TG, LDL, HDL, BUN, ESR, HB, K, Na, WBC, Lymph, Neut, PLT, EF-TTE]
ordinal: [Function Class, Region with RWMA]
binary:  [Sex, DM, HTN, Current Smoker, Ex-Smoker, FH, Obesity, CRF, CVA, Airway disease, Thyroid Disease, CHF, DLP, Edema, Weak Peripheral Pulse, Lung rales, Systolic Murmur, Diastolic Murmur, Typical Chest Pain, Dyspnea, Atypical, Nonanginal CP, Exertional CP, LowTH Ang, Q Wave, ST Elevation, ST Depression, T inversion, LVH, Poor R Progression]
nominal: [Rhythm, VHD]
leakage: [LAD, LCX, RCA, Cath]
```
Adding a feature = one YAML line. Adding a model = one registry entry (§4).

---

## 4. Modeling

### 4.1 Model registry (config-driven — NFR2)
```python
TARGETS = ["CAD", "LAD", "LCX", "RCA"]   # shared enum (NFR3), identical to frontend/mesh ids
```
One trained `Pipeline` per target, stored as `models/{target}.joblib`; one SHAP explainer per target as `models/{target}_shap.joblib`.

### 4.2 Candidate algorithms (compare, then pick per target)
- **Logistic Regression** (balanced) — interpretable baseline, great for LinearExplainer.
- **Random Forest** (balanced) — robust, TreeExplainer.
- **XGBoost / LightGBM** — usually best on tabular; `scale_pos_weight`.
- **Optional ensemble** (soft-voting) — for the stretch "model choice" toggle (S5).

Select the best per target by **mean CV ROC-AUC** (tie-break: F1, then calibration error). Report the comparison in docs — this *is* "validation methodology" points.

### 4.3 Validation methodology (Requirement 1e, 30% of score)
- **Stratified 10-fold CV** (matches dataset literature; keeps class ratio per fold).
- Report **mean ± std** for accuracy, precision, recall, F1, ROC-AUC — per target.
- **Calibration:** wrap final model in `CalibratedClassifierCV` (isotonic/sigmoid) so probabilities are trustworthy (they drive the 3D color — miscalibration = misleading anatomy).
- **Confusion matrix**, **ROC curve**, **calibration curve** saved as PNG per target to `models/plots/`.
- **Confidence estimate** (`confidence` field): derive from calibrated probability margin and/or CV std — document the formula; don't fake it.

### 4.4 Reproducibility (NFR4)
- `RANDOM_STATE = 42` everywhere (split, CV, model, SMOTE).
- `train.py` is deterministic and idempotent: `python train.py` → regenerates weights, `metrics.json`, and plots.
- Pin all versions in `requirements.txt` / `pyproject.toml`.
- Commit `metrics.json` so the `/metrics` endpoint works even before retrain.

---

## 5. Explainability service (Requirement 3b/3c, 20% of score)

- **Per-target SHAP explainer** fit at train time on the transformed background set; persisted.
- **Global:** SHAP summary (mean |value| per feature) → served to Model Trust panel.
- **Per-instance:** on `/explain`, compute SHAP for the submitted patient for the requested target → return ranked contributions with sign (raises/lowers risk) mapped back to **human-readable feature names**.
- **Physiology breakdown (3c):** for each top feature, return `{feature, patient_value, population_reference, shap_value, direction}` so the UI can show "your LDL 165 (pop. mean 104) → +0.12 risk."
- **Fallback:** if SHAP is too slow in the What-If loop, expose `/explain?fast=true` using LinearExplainer or precomputed base values; keep full SHAP for the click-to-inspect path.

> LIME is an acceptable alternative per the brief, but **SHAP is the primary** — additive attributions map cleanly onto the physiology bars and the vessel narrative.

---

## 6. API specification

Base: `/api/v1`. All responses JSON. CORS enabled for the frontend origin. FastAPI auto-serves OpenAPI at `/docs`.

### 6.1 `GET /health`
→ `{ "status": "ok", "model_version": "1.0.0" }`

### 6.2 `GET /schema`  *(drives the dynamic input form — NFR2)*
Returns every input feature with type, category, allowed values/range, unit, default, and display label. Example element:
```json
{ "name": "LDL", "label": "LDL Cholesterol", "type": "numeric",
  "group": "Laboratory & Echo", "unit": "mg/dL", "min": 18, "max": 232,
  "default": 104, "modifiable": true }
```
`modifiable: true` flags What-If–eligible features.

### 6.3 `GET /patients` / `GET /patients/{id}`
- List: `[{ "id": 12, "summary": "58M · HTN · typical CP", "actual_cad": "CAD" }, ...]`
- Detail: full canonical feature vector for that dataset row (for *Load Sample Patient*). Include `actual_*` ground-truth labels **for demo overlay only** (clearly marked; never fed back as input).

### 6.4 `POST /predict`
**Request:**
```json
{ "features": { "Age": 58, "Sex": 1, "BP": 140, "LDL": 165, "FBS": 120, "EF-TTE": 45, "...": "..." } }
```
**Response:**
```json
{
  "predictions": {
    "CAD": { "label": "CAD",      "probability": 0.87, "confidence": 0.81 },
    "LAD": { "label": "Stenotic", "probability": 0.74, "confidence": 0.70 },
    "LCX": { "label": "Normal",   "probability": 0.22, "confidence": 0.68 },
    "RCA": { "label": "Stenotic", "probability": 0.61, "confidence": 0.64 }
  },
  "model_version": "1.0.0",
  "warnings": []
}
```
- Missing/out-of-range features → fill with schema default + add to `warnings` (never 500 on a demo).
- `probability` ∈ [0,1] is the **stenosis/CAD-positive** probability → directly drives 3D color.

### 6.5 `POST /explain`
**Request:** `{ "features": {...}, "target": "LAD", "fast": false }`
**Response:**
```json
{
  "target": "LAD",
  "base_value": 0.31,
  "prediction": 0.74,
  "contributions": [
    { "feature": "Typical Chest Pain", "value": "Yes", "shap": 0.14, "direction": "increases", "population_reference": "54% have it" },
    { "feature": "EF-TTE", "value": 45, "shap": 0.09, "direction": "increases", "population_reference": "mean 47%" },
    { "feature": "HDL", "value": 38, "shap": -0.04, "direction": "decreases", "population_reference": "mean 40" }
  ],
  "narrative": "Elevated LAD stenosis risk is driven mainly by typical chest pain and reduced ejection fraction."
}
```
`narrative` is **templated from SHAP + values only** (no free LLM hallucination) — supports stretch S2.

### 6.6 `GET /metrics`
Per-target metrics + curve asset URLs + global SHAP summary:
```json
{
  "CAD": {
    "accuracy": 0.91, "precision": 0.90, "recall": 0.93, "f1": 0.91, "roc_auc": 0.94,
    "cv": { "roc_auc_mean": 0.93, "roc_auc_std": 0.03 },
    "plots": { "roc": "/static/plots/CAD_roc.png", "calibration": "/static/plots/CAD_cal.png", "confusion": "/static/plots/CAD_cm.png" },
    "top_features": [{ "feature": "Typical Chest Pain", "importance": 0.21 }]
  },
  "LAD": { "...": "..." }, "LCX": { "...": "..." }, "RCA": { "...": "..." }
}
```

---

## 7. Project structure

```
backend/
├── app/
│   ├── main.py               # FastAPI app + routers + CORS
│   ├── api/
│   │   ├── predict.py        # /predict
│   │   ├── explain.py        # /explain
│   │   ├── patients.py       # /patients
│   │   ├── metrics.py        # /metrics
│   │   └── schema.py         # /schema
│   ├── core/
│   │   ├── config.py         # paths, RANDOM_STATE, target enum
│   │   ├── features.yaml     # feature groups (single source of truth)
│   │   └── registry.py       # model + explainer loading
│   ├── ml/
│   │   ├── preprocess.py     # build_X, ColumnTransformer, leakage guard
│   │   ├── train.py          # deterministic training → weights+metrics+plots
│   │   ├── evaluate.py       # CV, metrics, curves
│   │   └── explain.py        # SHAP wrappers + narrative templater
│   └── schemas/              # Pydantic request/response models
├── models/                   # *.joblib weights, *_shap.joblib, metrics.json, plots/
├── data/                     # dataset CSV + data card
├── tests/
│   ├── test_leakage.py       # MUST pass (Req 1d)
│   ├── test_api.py
│   └── test_reproducibility.py
├── requirements.txt / pyproject.toml
├── Dockerfile
└── README.md
```

---

## 8. Non-functional / ops

- **Latency:** `/predict` < 300 ms; `/explain` full < 1.2 s; `/explain?fast=true` < 200 ms (for What-If).
- **Startup:** models loaded once at boot into the registry (no per-request disk read).
- **Errors:** validation via Pydantic; graceful defaults + `warnings`; structured error JSON, never bare 500 in demo paths.
- **Extensibility (NFR2):** new feature → `features.yaml`; new model/target → `TARGETS` + registry + retrain; new vessel → same enum shared with frontend.
- **Consistency (NFR3):** the `TARGETS` enum is the *only* place target names are defined; exported to frontend as generated types.
- **Reproducibility test:** `test_reproducibility.py` asserts retraining with seed yields identical metrics.

---

## 9. Backend Definition of Done

- [ ] `build_X` drops `LAD/LCX/RCA/Cath`; `test_leakage.py` green.
- [ ] 4 models trained via `train.py`, weights + `metrics.json` + plots committed.
- [ ] Stratified 10-fold CV; metrics reported mean±std per target; probabilities calibrated.
- [ ] SHAP explainers persisted; `/explain` returns ranked contributions + physiology refs + narrative.
- [ ] All endpoints live, documented at `/docs`, CORS working, sample patients load.
- [ ] `docker build` + run works from clean clone; README lists prereqs + run steps.
- [ ] Datasets credited in README/data card.
