# CardioTwin — Master Product Requirements Document (PRD)

> **Project:** CardioTwin — An Explainable Cardiac Digital Twin
> **Hackathon:** Multimodal AI Hackathon 2026 — **Track A: Cardiovascular Risk Visualization & Prediction**
> **Round:** Prototype / MVP submission
> **Owner:** Rishabh Rana
> **Status:** v1.0 — Build spec (locked)
> **Companion docs:** `PRD_Frontend.md`, `PRD_Backend.md`

---

## 0. TL;DR (read this first)

CardioTwin predicts **overall Coronary Artery Disease (CAD)** and **per-vessel stenosis (LAD, LCX, RCA)** from routine clinical, ECG, lab, and echo data — no angiography needed — and paints those predictions onto a **3D heart you can rotate, zoom, and click**. Click a coronary artery and the app shows *why* that vessel is at risk (SHAP), which of the patient's own measurements drove it, and a plain-language explanation. A **"What-If" digital-twin panel** lets you drag a patient's blood pressure, cholesterol, or FBS and watch the heart re-color in real time — the single most memorable moment in the demo.

**Why this wins:** it hits four of the five rubric buckets in one interaction (click vessel → risk + SHAP + physiology, live on a 3D model), uses a clean 303-record public dataset with zero acquisition friction, and rigorously handles the target-leakage rule that most teams will get wrong.

---

## 1. Problem Statement (from Track A)

Cardiovascular disease is a leading cause of death globally. Statistical models can output a risk *percentage*, but a raw number gives neither clinician nor patient any intuitive sense of **where** and **how** pathology is developing inside the body. Angiography — the gold standard for detecting stenosis — is invasive, costly, and has side effects.

**The challenge:** Build an interactive 3D visualization system that predicts coronary artery disease and overall cardiac risk from patient physiological and clinical data, mapping predictions onto an interactive 3D human anatomical model.

---

## 2. Vision & Winning Thesis

**Vision:** Turn a non-invasive risk model into a *spatial, interrogable, explainable* clinical decision-support experience — a "digital twin" of the patient's coronary tree.

**Winning thesis (the wedge):** Most teams will ship "a model + a chart" or "a model + a static heart picture." We ship **one unified interaction** where risk, explanation, and anatomy live in the same click:

1. **Interactive, not illustrative** — a genuine 3D coronary tree where LAD/LCX/RCA are individually addressable, color-coded nodes, not a static render.
2. **SHAP wired into the anatomy** — click a vessel → its own SHAP waterfall + the exact patient measurements that drove *that* vessel's prediction.
3. **The What-If Digital Twin** — drag a risk factor, watch the heart recolor and the prediction shift live. Demonstrates the model's learned causality viscerally.
4. **Rigor as a differentiator** — leakage handled correctly, honest cross-validated metrics, calibrated probabilities, uncertainty shown. On a 303-record dataset, *trustworthiness* out-scores inflated accuracy.

---

## 3. Goals & Success Metrics

### 3.1 Product goals
- **G1** — Predict overall CAD status and per-vessel (LAD/LCX/RCA) stenosis from non-invasive features.
- **G2** — Render an interactive 3D heart with real-time, per-vessel risk color mapping.
- **G3** — Explain every prediction at the vessel level (SHAP) with a physiological breakdown.
- **G4** — Let users explore counterfactuals live (What-If digital twin).
- **G5** — Ship a reproducible, well-documented, clearly-disclaimered prototype.

### 3.2 Success metrics (what "done + winning" looks like)

| Area | Target | Rubric tie-in |
|---|---|---|
| CAD classifier | ROC-AUC ≥ 0.90, F1 ≥ 0.88 (stratified 10-fold CV) | Predictive Performance (30%) |
| Vessel classifiers (LAD/LCX/RCA) | ROC-AUC ≥ 0.80 each; report per-vessel | Predictive Performance (30%) |
| Leakage | LAD, LCX, RCA, Cath **excluded** from all inputs; verified in code | Predictive Performance / Tech Impl. |
| 3D interaction | 60 FPS rotate/zoom on integrated-GPU laptop; per-vessel select works | 3D Visualization (25%) |
| Explanation | SHAP per vessel + top-N feature contributions rendered in UI | Clinical Interpretability (20%) |
| Latency | Prediction + SHAP round-trip < 1.5 s; What-If re-color < 400 ms | System Integration (15%) |
| Reproducibility | `git clone` → one command → running app; fixed seeds | Technical Implementation (10%) |
| Safety | Persistent, visible clinical disclaimer on every screen | Requirement 5 (mandatory) |

---

## 4. Rubric-Driven Priorities

The evaluation weights **are** the product backlog. Build in this order of value density:

| Rubric criterion | Weight | Our primary answer |
|---|---:|---|
| Predictive Performance | 30% | 4 calibrated classifiers, leakage-safe, stratified 10-fold CV, full metric suite + ROC/calibration curves |
| 3D Visualization | 25% | R3F coronary tree, per-vessel color nodes, rotate/zoom/select, animated risk transitions |
| Clinical Interpretability | 20% | Vessel-level SHAP waterfall + physiological contribution bars + plain-language narrative |
| System Integration | 15% | FastAPI ↔ React contract, real-time re-color, sample-patient loader, What-If live loop |
| Technical Implementation | 10% | Modular architecture, seeds, Docker, README, public datasets/meshes credited |

> **Rule of thumb for every feature decision:** if it doesn't move one of these five bars, it's a stretch goal, not MVP.

---

## 5. Users & Personas

- **P1 — Cardiologist / clinician (primary demo persona):** wants a fast, explainable second opinion and to see *where* risk concentrates. Values interpretability and honest confidence.
- **P2 — Patient / caregiver:** wants an intuitive, non-scary picture of their heart and what drives their risk. Values the plain-language narrative and What-If.
- **P3 — Hackathon judge:** wants to see rubric coverage, technical rigor, and a demo that doesn't break. Values the leakage handling, metrics panel, and the click-vessel-to-explain moment.

---

## 6. Scope

### 6.1 In scope (MVP — must ship)
1. Data pipeline for the Z-Alizadeh Sani **Extension** dataset (leakage-safe).
2. Four classifiers: CAD (overall) + LAD + LCX + RCA stenosis.
3. Model evaluation suite (accuracy, precision, recall, F1, ROC-AUC) with stratified 10-fold CV.
4. SHAP explainer per model (global + per-prediction).
5. FastAPI backend serving predict + explain + sample-patient endpoints.
6. React + React Three Fiber 3D heart viewer with per-vessel color mapping and rotate/zoom/select.
7. Clinical dashboard: overall CAD status, vessel probabilities, SHAP breakdown, physiology contributions.
8. Patient input workflow (manual form + load-sample-patient).
9. **What-If digital-twin panel** (sliders → live re-predict + re-color).
10. Persistent clinical safety disclaimer.
11. Documentation (≤ 6 pages), README, presentation deck, demo video.

### 6.2 Stretch (only after MVP is green — aligned, never off-track)
- **S1 — Confidence / uncertainty band** per prediction (calibrated probability + CI from CV variance).
- **S2 — Clinical narrative generator**: templated plain-language summary built *only* from SHAP + input values (no hallucinated facts).
- **S3 — Cohort explorer**: browse the 303 dataset patients, filter by risk, load any into the twin.
- **S4 — PDF risk report export** (dashboard snapshot + metrics + disclaimer).
- **S5 — Ensemble / model-choice toggle** (LogReg vs GBM vs ensemble) to show validation depth.
- **S6 — Voice/plain-language read-out** of the narrative (accessibility).

### 6.3 Explicitly out of scope
- Any use of real medical imaging / pixel-level lesion mapping (dataset doesn't support it — the primer says so explicitly).
- Treating the app as a real diagnostic tool (educational prototype only).
- Auth, multi-user accounts, persistence of patient records to a DB (not rubric-relevant).

---

## 7. Feature Specification (functional requirements)

Each feature is tagged with the Track A requirement(s) it satisfies. Full traceability in §11.

### F1 — Non-invasive prediction engine `[Req 1]`
- Predict **overall CAD** (binary: CAD / Normal).
- Predict **stenosis status** for **LAD, LCX, RCA** (binary each: Stenotic / Normal).
- Inputs: demographic, symptom/examination, ECG, laboratory, echo features **only**.
- **Hard rule:** LAD, LCX, RCA, and Cath are **never** model inputs (leakage prevention).
- Output: calibrated probability + class per target.

### F2 — Interactive 3D heart viewer `[Req 2, Req 4]`
- Render a 3D heart/torso mesh (open-source `.glb`/`.gltf`/`.obj`).
- LAD, LCX, RCA rendered as distinct, individually color-coded structures/overlays.
- Color = risk gradient (green → amber → red) bound to predicted stenosis probability.
- Rotate, zoom, pan; click/hover a vessel to select and inspect it.
- Smooth animated color transitions when predictions change.

### F3 — Clinical dashboard `[Req 3]`
- Overall CAD status card (class + probability + confidence).
- Per-vessel probability cards (LAD/LCX/RCA), synced with 3D selection.
- **SHAP breakdown** for the selected target (waterfall / bar).
- **Physiological contribution** view: patient's measurements next to their relative contribution to the prediction.

### F4 — Patient input workflow `[Req 1, Integration]`
- Manual entry form grouped by feature category (Demographic / Symptom & Exam / ECG / Lab & Echo).
- Validation with clinical ranges; sensible defaults.
- **Load Sample Patient**: pick a real dataset record to populate instantly (demo-safe).

### F5 — What-If Digital Twin `[Req 2, Req 3, Integration]` ⭐ differentiator
- Sliders/toggles for key modifiable factors (BP, FBS, TG, LDL, HDL, BMI, smoker, typical chest pain, etc.).
- Debounced live re-prediction → 3D re-color + dashboard update < 400 ms.
- "Reset to baseline" and a delta indicator (risk ↑/↓ vs original).

### F6 — Clinical safety disclaimer `[Req 5]`
- Persistent, visible banner/footer on every view: *"For decision support and educational purposes only. Not a substitute for formal diagnostic imaging or professional medical advice."*
- Also shown on first load (modal/acknowledge) and printed in any exported report.

### F7 — Model trust / validation panel `[Predictive Performance, Interpretability]`
- Displays evaluation metrics per model (accuracy, precision, recall, F1, ROC-AUC).
- ROC curve + calibration curve + confusion matrix (static assets generated at train time, served to UI).
- Global feature-importance (SHAP summary) per target.

---

## 8. Non-Functional Requirements

- **NFR1 — No-GPU performance:** responsive 3D in modern browsers on integrated graphics (Req: "without requiring dedicated GPUs"). Target 60 FPS idle, ≥ 30 FPS during interaction.
- **NFR2 — Extensibility:** adding a clinical feature, a new model, or a new anatomical structure must not require a redesign (Req: architecture must support additions). Enforced via config-driven feature list + model registry + vessel-mesh registry.
- **NFR3 — Output↔anatomy consistency:** a stable, single source of truth maps model target → vessel mesh id → color node (Req: "consistent correspondence"). One shared enum: `CAD | LAD | LCX | RCA`.
- **NFR4 — Reproducibility:** fixed random seeds, pinned dependencies, deterministic training script, committed model weights + metrics.
- **NFR5 — Latency:** predict+SHAP < 1.5 s; What-If re-color < 400 ms (SHAP may be async/cached for What-If).
- **NFR6 — Portability:** runs via Docker Compose; also runnable locally with documented steps.

---

## 9. System Architecture (high level)

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (React)                           │
│                                                                   │
│   ┌───────────────┐   ┌────────────────┐   ┌──────────────────┐  │
│   │ Patient Input │   │  3D Heart View  │   │ Clinical Dashboard│ │
│   │  + Load Sample│   │  (R3F/Three.js) │   │ risk · SHAP · phys│ │
│   └───────┬───────┘   └───────┬────────┘   └────────┬─────────┘  │
│           │                   │  ▲ color bind        │            │
│           │        ┌──────────┴──┴───────────┐       │            │
│           └───────►│  App State (Zustand)     │◄──────┘            │
│                    │  patient · predictions · │                   │
│                    │  shap · selectedVessel   │                   │
│                    └────────────┬─────────────┘                   │
│                    What-If panel │ (debounced)                     │
└─────────────────────────────────┼─────────────────────────────────┘
                                   │  REST / JSON
                     ┌─────────────▼─────────────┐
                     │      FastAPI backend       │
                     │  /predict  /explain        │
                     │  /patients /metrics /health│
                     └─────────────┬─────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐
     │ Preprocess     │  │ Model Registry    │  │ SHAP Explainers │
     │ pipeline (sk)  │  │ CAD/LAD/LCX/RCA   │  │ per target      │
     │ leakage-safe   │  │ (.joblib weights) │  │ (.joblib)       │
     └────────────────┘  └──────────────────┘  └─────────────────┘
              ▲
     ┌────────┴─────────┐
     │ Z-Alizadeh Sani  │  (offline: train.py → weights + metrics + plots)
     │ Extension CSV    │
     └──────────────────┘
```

**Contract-first:** a single OpenAPI schema is the boundary. Frontend and backend are built against the shared JSON contract in §10 so they can be developed in parallel.

---

## 10. Canonical API Contract (source of truth for both teams)

Full detail in `PRD_Backend.md`. Summary:

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | liveness |
| `/schema` | GET | feature list, types, ranges, categories (drives the input form dynamically) |
| `/patients` | GET | list sample patients (id + summary) |
| `/patients/{id}` | GET | full feature vector for a sample patient |
| `/predict` | POST | features → predictions for CAD + LAD + LCX + RCA |
| `/explain` | POST | features (+ target) → SHAP contributions + physiology breakdown |
| `/metrics` | GET | evaluation metrics + curve asset URLs per model |

**Shared target enum (NFR3):** `["CAD", "LAD", "LCX", "RCA"]` — used identically in model keys, API responses, 3D mesh ids, and UI color nodes.

**`/predict` response shape (abridged):**
```json
{
  "predictions": {
    "CAD": { "label": "CAD", "probability": 0.87, "confidence": 0.81 },
    "LAD": { "label": "Stenotic", "probability": 0.74, "confidence": 0.7 },
    "LCX": { "label": "Normal", "probability": 0.22, "confidence": 0.68 },
    "RCA": { "label": "Stenotic", "probability": 0.61, "confidence": 0.64 }
  },
  "model_version": "1.0.0"
}
```

---

## 11. Requirements Traceability Matrix (every Track A point → where it's satisfied)

| # | Track A requirement (verbatim intent) | Satisfied by | Doc |
|---|---|---|---|
| 1a | Train classification model to predict **overall CAD status** | F1; CAD classifier | Backend |
| 1b | Predict **stenosis status for LAD, LCX, RCA** | F1; 3 vessel classifiers | Backend |
| 1c | Use demographic, clinical exam, ECG, lab, **echo** features | Preprocessing uses all 4 feature groups | Backend |
| 1d | **Exclude LAD, LCX, RCA, Cath** from inputs (no leakage) | Feature-drop guard + unit test | Backend §leakage |
| 1e | Evaluate with accuracy, precision, recall, F1, **ROC-AUC** | F7; eval suite + `/metrics` | Backend |
| 2a | Render interactive 3D torso/heart (Three.js/WebGL/R3F/VTK) | F2; R3F viewer | Frontend |
| 2b | **Dynamically color** LAD/LCX/RCA nodes by predicted probability | F2; risk→color binding | Frontend |
| 2c | Rotate, zoom, **select** regions for vessel-specific detail | F2; OrbitControls + raycast select | Frontend |
| 3a | Show overall CAD + vessel probabilities beside 3D | F3; dashboard cards | Frontend |
| 3b | Interpretable **why** (SHAP or LIME) | F3, F7; SHAP waterfall | Both |
| 3c | Show physiological measurements + relative contribution | F3; physiology breakdown | Both |
| 4a | Use open-source mesh `.obj/.gltf` for anatomy | F2; BodyParts3D / Sketchfab / NIH 3D | Frontend |
| 5 | Clear **visible clinical disclaimer** (decision support only) | F6; persistent banner + modal + report | Frontend |
| TC1 | Responsive 3D **without dedicated GPU** | NFR1; LOD, instancing, capped DPR | Frontend |
| TC2 | Architecture supports adding features/models/structures | NFR2; config-driven registries | Both |
| TC3 | Consistent model↔LAD/LCX/RCA correspondence | NFR3; shared target enum | Both |

### Deliverables checklist (from Track A + submission guidelines + this round)

| Deliverable | Where produced | Status field |
|---|---|---|
| Working software prototype (web app, 3D viewer + ML backend) | Frontend + Backend | ☐ |
| Trained prediction pipeline (clean code + **model weights**) | Backend `/models`, `train.py` | ☐ |
| Clinical explanation dashboard (metrics, SHAP/LIME, physiology) | Frontend F3/F7 | ☐ |
| Project documentation (preprocessing, model arch, 3D pipeline, usage, results — **≤ 6 pages**) | `/docs/TECHNICAL_DOC.md` → PDF | ☐ |
| Demonstration video (**3–10 min**, YouTube, English audio or subtitles) | recorded | ☐ |
| **Presentation deck** (this round) | `/docs/deck` | ☐ |
| **Source code** public GitHub + README (setup, prerequisites, run instructions) | repo root | ☐ |
| Devpost project description | Devpost | ☐ |
| Team info (real full names, all on Devpost) | Devpost | ☐ |
| Public datasets + anatomical resources credited | README / docs | ☐ |

---

## 12. Dataset Summary (drives the backend)

- **Dataset:** Extension of Z-Alizadeh Sani (UCI / Kaggle / Mendeley). **303 records**, **~55 features**, **no missing values**.
- **Class balance (overall CAD):** ~216 CAD vs ~87 Normal → **imbalanced (~71/29)** → use stratified CV + class weights / SMOTE (train folds only).
- **Feature groups:** Demographic, Symptom & Examination, ECG, Laboratory & Echo.
- **Targets:** `Cath` (CAD/Normal overall) + per-vessel `LAD`, `LCX`, `RCA` (Normal/Stenotic; stenosis = ≥ 50% narrowing).
- **Leakage guard (critical):** when predicting CAD or any vessel, drop `LAD, LCX, RCA, Cath` from `X`. Full column-level spec in `PRD_Backend.md`.
- **Prior-art benchmarks (context, not targets):** CAD accuracy commonly 88–98%; vessel-level ~83–86%. We prioritize *honest, leakage-safe, cross-validated* numbers over headline accuracy.

---

## 13. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | fast, typed, familiar |
| 3D | React Three Fiber + drei + Three.js | R3F is explicitly sanctioned; declarative, performant |
| State | Zustand | tiny, ideal for shared patient/prediction/selection state |
| Charts | Recharts / visx | SHAP bars, ROC, calibration |
| Styling | Tailwind CSS | speed + clean clinical UI |
| Backend | FastAPI (Python 3.11) | async, auto OpenAPI, pairs with sklearn |
| ML | scikit-learn, XGBoost/LightGBM, imbalanced-learn | tabular sweet spot |
| Explainability | SHAP (TreeExplainer/LinearExplainer) | sanctioned; per-vessel attributions |
| Packaging | Docker + Docker Compose | one-command reproducible run |
| Meshes | BodyParts3D / Sketchfab / NIH 3D (`.glb`) | sanctioned open-source anatomy |

---

## 14. Build Sequence (execution plan)

> Optimized so there's always a demoable artifact and the two PRDs can proceed in parallel after Phase 0.

**Phase 0 — Foundations (Day 0)**
1. Repo scaffold (monorepo: `/backend`, `/frontend`, `/docs`, `/models`, `/data`).
2. Download dataset; commit data card (not raw PHI concerns — public).
3. Lock the API contract (§10) → generate TypeScript types + Pydantic models from one schema.

**Phase 1 — Backend core (Day 0–1)**
4. Preprocessing pipeline + **leakage guard + leakage unit test**.
5. Train 4 models; stratified 10-fold CV; save weights + metrics + curves.
6. SHAP explainers per model; `/predict`, `/explain`, `/metrics`, `/schema`, `/patients`.

**Phase 2 — Frontend core (Day 1–2, parallel)**
7. App shell, state store, input form (driven by `/schema`), disclaimer.
8. 3D viewer: load mesh, isolate LAD/LCX/RCA, orbit controls, select.
9. Bind predictions → color; dashboard cards.

**Phase 3 — Integration + the wow (Day 2)**
10. Wire predict/explain; vessel-select ↔ SHAP sync.
11. **What-If digital twin** (sliders → live re-color).
12. Model-trust panel (metrics + curves + global SHAP).

**Phase 4 — Polish + deliverables (Day 3)**
13. Sample-patient loader, animations, empty/error states, mobile-safe layout.
14. Stretch goals if green (narrative, cohort explorer, PDF export).
15. Docs (≤6 pp), README, deck, **rehearsed** demo video.

---

## 15. Demo Script (the 3-minute win)

1. **Hook (20s):** "Angiography is invasive and expensive. CardioTwin predicts coronary disease from a routine blood test and ECG — and shows you *where*." Show the 3D heart, disclaimer visible.
2. **Load a real patient (20s):** click *Load Sample Patient* → heart recolors, LAD glows red.
3. **Interrogate (40s):** click the LAD → dashboard shows 74% stenosis probability, SHAP waterfall, "driven by typical chest pain, ST-elevation, low EF." Click RCA → different story.
4. **The twin (50s):** drag LDL and FBS down, toggle smoker off → watch LAD fade amber→green live, risk delta −0.3. "This is the model's learned relationship between lifestyle factors and coronary risk."
5. **Trust (30s):** open Model Trust panel → ROC-AUC 0.9x, calibration curve, "and crucially, we exclude the angiography labels from inputs — no leakage." 
6. **Close (10s):** reiterate deliverables + disclaimer.

---

## 16. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Small dataset (303) → modest/unstable metrics | Predictive score | Stratified 10-fold CV, class weights, report mean±std, calibrate; frame honesty as strength |
| Vessel-level classes imbalanced | Vessel F1 | Per-vessel class weights / SMOTE on train folds only; report per-vessel, don't hide |
| **Accidental target leakage** | Disqualifying credibility hit | Explicit drop-list + automated unit test asserting forbidden cols absent from `X` |
| 3D perf on weak GPUs | 3D score / demo | Cap DPR, LOD meshes, instancing, disable heavy post-fx; test on integrated graphics |
| Mesh has no separable LAD/LCX/RCA | Req 2b blocked | Pre-select meshes with named vessel groups OR overlay vessel splines as separate objects mapped to the enum |
| SHAP too slow for What-If | Latency | Use fast explainer (Tree/Linear), cache background, or approximate/deferred SHAP for slider loop |
| Live demo breaks | Everything | Pre-baked sample patients, offline mode, recorded fallback clip |
| Scope creep into stretch goals | MVP slips | Freeze MVP; stretch only after §3.2 targets green |

---

## 17. Definition of Done

- [ ] All 4 models trained, leakage test passing, weights committed.
- [ ] `/metrics` shows full suite + curves; numbers reproduce from `train.py` with fixed seed.
- [ ] 3D heart: rotate/zoom/select works; LAD/LCX/RCA color-bound to live predictions.
- [ ] Click vessel → SHAP + physiology renders and matches the model output.
- [ ] What-If: slider change re-colors heart < 400 ms.
- [ ] Disclaimer visible everywhere + acknowledged on load + in export.
- [ ] `docker compose up` (or documented local run) → working app from clean clone.
- [ ] Docs ≤ 6 pages, README complete, deck done, demo video 3–10 min uploaded (English subs).
- [ ] Datasets + meshes credited; team on Devpost with real names.
