# CardioTwin — Frontend PRD

> **Scope:** The web UI — 3D heart viewer, clinical dashboard, patient input, and the What-If digital twin.
> **Parent:** `PRD_Master.md` · **Sibling:** `PRD_Backend.md`
> **Stack:** React + Vite + TypeScript · React Three Fiber + drei + Three.js · Zustand · Tailwind · Recharts/visx
> **Owner:** Rishabh Rana · **Status:** v1.0 build spec

---

## 1. Frontend responsibilities

1. Render an **interactive 3D heart** with individually addressable, color-coded LAD/LCX/RCA structures (Req 2).
2. Provide a **clinical dashboard** showing overall CAD + per-vessel probabilities, SHAP, and physiology (Req 3).
3. Capture patient data (manual form + load sample) and call the backend (Req 1 workflow).
4. Deliver the **What-If digital twin** — live recolor on slider change (differentiator).
5. Keep a **clinical safety disclaimer** visible at all times (Req 5).
6. Stay **responsive without a dedicated GPU** (TC1) and **extensible** (TC2), with a **single source of truth** for target↔vessel↔color (TC3/NFR3).

---

## 2. Screen & layout architecture

Single-page app, 3-zone clinical console (desktop-first, tablet-safe):

```
┌───────────────────────────────────────────────────────────────────────┐
│  TopBar:  CardioTwin logo · patient chip · model version · ⚠ DISCLAIMER │
├──────────────┬──────────────────────────────┬──────────────────────────┤
│  LEFT (320px)│        CENTER (fluid)         │     RIGHT (400px)        │
│              │                               │                          │
│  Patient     │      3D HEART VIEWER          │   Clinical Dashboard     │
│  Input /     │   (rotate · zoom · click)     │   • CAD status card      │
│  Load Sample │                               │   • LAD/LCX/RCA cards    │
│              │   vessel legend · color scale │   • SHAP for selected    │
│  What-If     │                               │   • Physiology breakdown │
│  sliders     │                               │   • [Model Trust ▸]      │
├──────────────┴──────────────────────────────┴──────────────────────────┤
│  Footer: persistent disclaimer + dataset/mesh credits                   │
└───────────────────────────────────────────────────────────────────────┘
```

- **< 1024px:** zones collapse into tabs (`Heart` / `Inputs` / `Results`); 3D stays primary.
- Selecting a vessel in the 3D view **drives** the right-panel context, and vice-versa (bi-directional sync).

---

## 3. The single source of truth (TC3 / NFR3)

One shared config maps model target → mesh object → color node. Generated types come from the backend `TARGETS` enum.

```ts
// vessels.config.ts — the ONLY place these are defined
export const VESSELS = {
  LAD: { label: "Left Anterior Descending", meshId: "artery_LAD", camera: [x,y,z] },
  LCX: { label: "Left Circumflex",          meshId: "artery_LCX", camera: [x,y,z] },
  RCA: { label: "Right Coronary Artery",    meshId: "artery_RCA", camera: [x,y,z] },
} as const;
export type Target = "CAD" | keyof typeof VESSELS; // matches backend enum exactly
```
Add a vessel later = one entry here + one mesh group + backend model. No redesign (TC2).

---

## 4. State model (Zustand)

```ts
interface AppState {
  schema: FeatureSchema | null;          // from /schema — drives the form
  patient: Record<string, number|string>; // current feature vector (working copy)
  baseline: Record<string, ...> | null;    // snapshot for What-If deltas
  predictions: Record<Target, Prediction> | null;
  explanation: Explanation | null;       // for selectedVessel
  selectedVessel: Target | null;         // null = whole-heart / CAD view
  metrics: MetricsBundle | null;
  status: "idle"|"loading"|"error";
  // actions: setFeature, loadSample, predict (debounced), selectVessel, explain, resetWhatIf
}
```
- **Derived:** `colorFor(vessel) = riskGradient(predictions[vessel].probability)`.
- Prediction calls are **debounced (250–350 ms)** so slider drags don't spam the API.

---

## 5. Component: 3D Heart Viewer (Req 2, 4 · TC1)

### 5.1 Rendering
- React Three Fiber `<Canvas>` with `dpr={[1, 1.75]}` (cap for weak GPUs), `frameloop="demand"` (render only on change → battery + perf).
- Load open-source heart mesh (`.glb` preferred) via drei `useGLTF`; **Draco-compress** it.
- Environment: soft studio lighting, subtle contact shadow, neutral clinical background (no heavy post-processing → TC1).

### 5.2 Vessel isolation & color mapping (Req 2b)
- Mesh must expose named sub-objects for LAD/LCX/RCA. Two supported strategies:
  - **A (preferred):** mesh already has named vessel groups → map by `meshId`.
  - **B (fallback):** overlay three tube/spline geometries (`CatmullRomCurve3` → `TubeGeometry`) positioned along each artery, each tagged with a `Target`. Guarantees per-vessel addressability regardless of mesh.
- Each vessel material color = `riskGradient(probability)`:
  - `0.0–0.33` → green `#16a34a`, `0.34–0.66` → amber `#f59e0b`, `0.67–1.0` → red `#dc2626` (continuous lerp, not hard steps).
- **Animated transitions:** lerp emissive/color over ~500 ms when predictions change (the What-If "wow").
- Optional gentle pulse on the highest-risk vessel to draw the eye (toggleable; off for the "serious" tone).

### 5.3 Interaction (Req 2c)
- drei `OrbitControls`: rotate, zoom, pan; damped.
- **Raycast select:** click a vessel → `selectVessel(target)` → camera eases to that vessel's stored angle → right panel loads its SHAP.
- **Hover:** highlight + tooltip `{vessel label, probability}`.
- On-canvas **legend**: color scale + vessel key. Always-visible small **disclaimer watermark** in a corner.
- "Reset view" and "Whole heart (CAD)" buttons.

### 5.4 Performance budget (TC1)
- Single Draco mesh < 3–4 MB; instancing for repeated geometry; no per-frame allocations.
- Target 60 FPS idle (demand loop → ~0 when static), ≥ 30 FPS during orbit on integrated graphics.
- Lazy-load the model; skeleton/spinner while loading.

---

## 6. Component: Patient Input Workflow (Req 1)

- **Dynamic form generated from `/schema`** — grouped accordions: *Demographic · Symptom & Exam · ECG · Lab & Echo*.
- Numeric → slider+number with min/max/unit; binary → toggle; nominal → select; ordinal → segmented control.
- Inline validation against schema ranges; defaults pre-filled so the form is never empty.
- **Load Sample Patient** dropdown (from `/patients`) → one click fills the whole form and predicts. (Primary demo path — robust, no typing on stage.)
- **Predict** button + auto-predict on sample load.
- Optional: show dataset ground-truth (`actual_cad`) as a small "reference" badge when a sample is loaded — **clearly labeled**, never used as input.

---

## 7. Component: Clinical Dashboard (Req 3)

### 7.1 Risk cards (3a)
- **Overall CAD card:** big label (CAD / Normal), probability %, confidence, color-matched to the heart.
- **Three vessel cards** (LAD/LCX/RCA): probability bar, class, confidence; clicking a card = selecting the vessel in 3D (bi-directional).

### 7.2 SHAP explanation (3b) — for `selectedVessel` (or CAD)
- **Waterfall / horizontal bar** of top contributions from `/explain`: red bars push risk up, green pull it down, ordered by |shap|.
- Base value → final prediction annotation.
- Plain-language **narrative** line above the chart (templated from SHAP; supports stretch S2).

### 7.3 Physiology breakdown (3c)
- Table/rows: `feature · patient value · population reference · contribution`.
- Visual: patient value vs population mean (small marker on a range) so "why" is felt, not just read.
- Only the features that actually contributed (top-N) to avoid noise.

### 7.4 Model Trust panel (drawer/modal — Predictive Performance + Interpretability)
- Per-target metrics table: accuracy, precision, recall, F1, **ROC-AUC** (mean±std from CV).
- Embedded **ROC**, **calibration**, **confusion matrix** images from `/metrics`.
- **Global SHAP summary** (top features overall) per target.
- One line on methodology: stratified 10-fold CV + leakage exclusion (this reassures judges).

---

## 8. Component: What-If Digital Twin (differentiator · Req 2/3 · Integration)

- Compact slider stack for **modifiable** features (schema `modifiable: true`): BP, FBS, TG, LDL, HDL, BMI/Weight, Current Smoker, Typical Chest Pain, etc.
- On change (debounced 300 ms): `predict` (+ `explain?fast=true` for the selected vessel) → 3D recolors + cards update, all animated.
- **Delta indicator:** each vessel shows ▲/▼ vs `baseline` (e.g., "LAD −0.28").
- **Reset to baseline** restores the loaded patient.
- Micro-copy frames it correctly: *"Exploring how modifiable factors relate to the model's predicted risk — not a treatment recommendation."*
- Latency target: recolor < 400 ms after drag settles (backend `fast` path makes this feasible).

---

## 9. Clinical Safety Disclaimer (Req 5 — mandatory, do not skip)

- **On first load:** modal the user must acknowledge.
- **Persistent:** condensed banner in TopBar **and** footer on every view; small watermark on the 3D canvas and on any exported report.
- Copy: *"CardioTwin is a decision-support and educational prototype. Predictions are not a diagnosis and are not a substitute for formal diagnostic imaging (e.g., angiography) or professional medical judgment."*
- Never hidden behind a scroll; always in viewport.

---

## 10. Design system

- **Tone:** clean clinical — lots of whitespace, one accent, risk palette reserved *only* for risk (green/amber/red) so color always means the same thing.
- **Palette:** neutral slate UI; risk gradient green `#16a34a` → amber `#f59e0b` → red `#dc2626`; accent teal `#0d9488`.
- **Type:** Inter / system UI; tabular numerals for metrics.
- **Motion:** purposeful only — color lerps, camera eases, card fades. No gratuitous animation (keeps the serious clinical read + helps TC1).
- **Dark + light** (dark reads great for the 3D scene); respect `prefers-color-scheme`.
- **Accessibility:** never encode risk by color alone — pair with %/label/icon; keyboard-selectable vessels; ARIA on cards; ≥ AA contrast.

> If building UI from scratch, load the `frontend-design` skill for typography/aesthetic direction so it doesn't read as a template.

---

## 11. API integration (contract from `PRD_Backend.md`)

| Action | Call |
|---|---|
| Boot | `GET /schema`, `GET /metrics`, `GET /patients` |
| Load sample | `GET /patients/{id}` → set form → `POST /predict` |
| Predict | `POST /predict` (features) → set predictions → recolor |
| Select vessel | `POST /explain` (features, target) → set explanation |
| What-If | debounced `POST /predict` + `POST /explain?fast=true` |

- Generate TS types from the backend OpenAPI schema (single source of truth).
- All calls go through one `api/client.ts` with base URL from env; handle `warnings`, show non-blocking toasts; never crash the UI on a bad field.
- Loading/skeleton states for 3D, cards, and charts; error boundary around the Canvas.

---

## 12. Project structure

```
frontend/
├── src/
│   ├── main.tsx / App.tsx
│   ├── config/vessels.config.ts     # target↔mesh↔color (TC3)
│   ├── store/useAppStore.ts         # Zustand
│   ├── api/client.ts + types.ts     # generated from OpenAPI
│   ├── three/
│   │   ├── HeartScene.tsx           # Canvas, lights, controls
│   │   ├── Vessel.tsx               # per-vessel mesh + color + raycast
│   │   ├── colorScale.ts            # riskGradient()
│   │   └── useHeartModel.ts         # GLTF load (Draco)
│   ├── components/
│   │   ├── PatientForm.tsx  SampleLoader.tsx
│   │   ├── WhatIfPanel.tsx
│   │   ├── RiskCards.tsx  ShapWaterfall.tsx  PhysiologyTable.tsx
│   │   ├── ModelTrustPanel.tsx
│   │   └── DisclaimerBanner.tsx / DisclaimerModal.tsx
│   └── styles/ (tailwind)
├── public/models/heart.glb          # Draco-compressed open-source mesh
├── index.html · vite.config.ts · package.json
└── README.md                        # incl. mesh source + license credit
```

---

## 13. Frontend Definition of Done

- [ ] 3D heart loads; rotate/zoom/pan smooth on integrated GPU (≥30 FPS interacting).
- [ ] LAD/LCX/RCA individually colored by live probability; click-to-select works both ways.
- [ ] Input form generated from `/schema`; Load Sample fills + predicts in one click.
- [ ] Dashboard shows CAD + vessel cards, SHAP waterfall, physiology breakdown for the selected vessel.
- [ ] What-If sliders recolor the heart < 400 ms with delta indicators.
- [ ] Model Trust panel shows metrics + ROC/calibration/confusion + global SHAP.
- [ ] Disclaimer: acknowledge modal + persistent banner/footer + canvas watermark.
- [ ] Responsive tabs < 1024px; dark/light; risk never color-only.
- [ ] Mesh + dataset credited in README; runs from clean clone with documented steps.
```
