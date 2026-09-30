# CardioTwin — Frontend Foundation & Architecture

> **Hackathon:** Multimodal AI Hackathon 2026 — Track A: Cardiovascular Risk Visualization & Prediction  
> **Documentation Source of Truth:** `docs/PRD_Frontend.md` & `docs/PRD_Master.md`

---

## 🛠️ Technology Stack

- **Framework:** React 18 + Vite + TypeScript (Strict Mode enabled)
- **3D Visualization:** React Three Fiber (`@react-three/fiber`), `@react-three/drei`, `three.js`
- **Postprocessing:** `@react-three/postprocessing`
- **State Management:** Zustand
- **Styling:** Tailwind CSS (Dark Mode default: `class`, Clinical "Command Center" theme)
- **UI Animation:** Framer Motion (Purposeful only, `prefers-reduced-motion` protected)
- **Charts:** Recharts
- **Notifications:** `react-hot-toast`
- **Typography:** Inter (Google Fonts / `@fontsource/inter`), tabular numerals for all metrics

---

## 🎨 Design System & Reserved Tokens

1. **Clinical Command Center Palette:**
   - Backgrounds: `#090d16` (3D scene base), `#0f172a` (panels), `#1e293b` (cards)
   - Clinical Accent: Teal `#0d9488` (`#2dd4bf` light / `#0f766e` dark)
2. **Reserved Risk Palette (STRICTLY for Risk Visualization, never decorative):**
   - **Low Risk / Normal:** Green `#16a34a` (0.00 – 0.33)
   - **Moderate Risk:** Amber `#f59e0b` (0.34 – 0.66)
   - **Stenotic / High Risk:** Red `#dc2626` (0.67 – 1.00)
3. **Glassmorphism:** Hairline 1px border (`border-white/10`), soft shadow, subtle backdrop-blur (`<GlassPanel />`).

---

## 🔌 API Architecture (Mock-First)

The frontend uses a mock-first architecture with a unified interface:

```typescript
export interface CardioApi {
  getHealth(): Promise<HealthResponse>;
  getSchema(): Promise<FeatureSchema>;
  getPatients(): Promise<SamplePatientSummary[]>;
  getPatient(id: number): Promise<SamplePatientDetail>;
  predict(features: Record<string, number | string>): Promise<PredictResponse>;
  explain(features: Record<string, number | string>, target: Target, fast?: boolean): Promise<Explanation>;
  getMetrics(): Promise<MetricsBundle>;
}
```

- **Mock Implementation:** `src/api/mockApi.ts` (instant responses with realistic clinical heuristic outputs)
- **HTTP Implementation:** `src/api/httpApi.ts` (REST calls to `/api/v1`)
- **Switch:** Controlled via `VITE_USE_MOCK` in `.env` (default: `true`).

---

## 🚀 Running Locally

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build
```
