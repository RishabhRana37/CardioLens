import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Target,
  Prediction,
  Explanation,
  FeatureSchema,
  MetricsBundle,
  SamplePatientSummary,
} from '../api/types';
import { api } from '../api';
import { riskGradient } from '../three/colorScale';

export type GraphicQuality = 'cinematic' | 'balanced' | 'performance';
export type AppTheme = 'dark' | 'light';
export type MobileTab = 'heart' | 'inputs' | 'results';
export type AppSection = 'heart' | 'inputs' | 'metrics' | 'split';

export interface AppState {
  // Application Settings & System Preferences (Persisted)
  quality: GraphicQuality;
  theme: AppTheme;
  disclaimerAcknowledged: boolean;

  // Modals, Navigation & Visual Modes
  isDisclaimerModalOpen: boolean;
  isModelTrustOpen: boolean;
  isAngiogramMode: boolean;
  isCrossSectionOpen: boolean;
  isCompareMode: boolean;
  isProjectionMode: boolean;
  cameraPreset: 'anterior' | 'posterior' | 'left' | 'right' | 'apical' | null;
  activeSection: AppSection;
  activeMobileTab: MobileTab;

  // Boot & Initialization
  isInitialized: boolean;
  status: 'idle' | 'loading' | 'error';
  errorMessage: string | null;
  isPredicting: boolean;
  isExplaining: boolean;

  // Clinical Schema & Cohort
  schema: FeatureSchema | null;
  patients: SamplePatientSummary[];
  currentPatientId: number | null;
  patient: Record<string, number | string> | null; // Working feature vector
  baseline: Record<string, number | string> | null; // Baseline snapshot for What-If deltas
  patientSummary: string | null;
  patientRiskTier: 'high' | 'moderate' | 'low' | null;

  // Predictions & Explainability
  predictions: Record<Target, Prediction> | null;
  baselinePredictions: Record<Target, Prediction> | null; // Baseline predictions for What-If delta comparison
  projectionPredictions: Record<Target, Prediction> | null; // Live projection predictions for horizon trajectory
  explanation: Explanation | null;
  selectedVessel: Target | null; // null = CAD / Whole Heart
  metrics: MetricsBundle | null;

  // Debounce timer ID tracker
  _debounceTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  init: () => Promise<void>;
  loadSample: (id: number) => Promise<void>;
  setFeature: (name: string, value: number | string) => void;
  predict: () => void;
  predictImmediate: () => Promise<void>;
  selectVessel: (target: Target | null) => Promise<void>;
  explain: (targetOverride?: Target | null, fast?: boolean) => Promise<void>;
  resetWhatIf: () => Promise<void>;
  colorFor: (target: Target) => string;
  setProjectionMode: (active: boolean) => void;
  setProjectionPredictions: (preds: Record<Target, Prediction> | null) => void;

  // Intro Reveal Animation State
  isIntroPlaying: boolean;
  introKey: number;
  playIntro: () => void;
  skipIntro: () => void;

  // Audio Auscultation State
  isAudioEnabled: boolean;
  toggleAudio: () => void;

  // UI Setting Actions
  setQuality: (quality: GraphicQuality) => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  toggleAngiogramMode: () => void;
  setAngiogramMode: (active: boolean) => void;
  toggleCrossSection: () => void;
  setCrossSectionOpen: (open: boolean) => void;
  toggleCompareMode: () => void;
  setCompareMode: (compare: boolean) => void;
  setCameraPreset: (preset: 'anterior' | 'posterior' | 'left' | 'right' | 'apical' | null) => void;
  setDisclaimerAcknowledged: (ack: boolean) => void;
  openDisclaimerModal: () => void;
  closeDisclaimerModal: () => void;
  openModelTrust: () => void;
  closeModelTrust: () => void;
  setActiveSection: (section: AppSection) => void;
  setActiveMobileTab: (tab: MobileTab) => void;
  clearPatient: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Default Persisted Preferences
      quality: 'cinematic',
      theme: 'dark',
      disclaimerAcknowledged: false,

      // Default Session State
      isDisclaimerModalOpen: false,
      isModelTrustOpen: false,
      isAngiogramMode: false,
      isCrossSectionOpen: false,
      isCompareMode: false,
      isProjectionMode: false,
      cameraPreset: null,
      activeSection: 'heart',
      activeMobileTab: 'heart',
      isInitialized: false,
      status: 'idle',
      errorMessage: null,
      isPredicting: false,
      isExplaining: false,

      // Intro Reveal State
      isIntroPlaying: true,
      introKey: 0,

      // Audio Auscultation State
      isAudioEnabled: true,

      schema: null,
      patients: [],
      currentPatientId: null,
      patient: null,
      baseline: null,
      patientSummary: null,
      patientRiskTier: null,

      predictions: null,
      baselinePredictions: null,
      projectionPredictions: null,
      explanation: null,
      selectedVessel: null,
      metrics: null,

      _debounceTimer: null,

      /**
       * Initialize application foundation data on boot:
       * Schema, Patient Cohort, Metrics, and auto-load default Patient 101.
       */
      init: async () => {
        if (get().isInitialized) return;
        set({ status: 'loading', errorMessage: null });

        try {
          const [schemaRes, patientsRes, metricsRes] = await Promise.all([
            api.getSchema(),
            api.getPatients(),
            api.getMetrics(),
          ]);

          set({
            schema: schemaRes,
            patients: patientsRes,
            metrics: metricsRes,
            isInitialized: true,
            status: 'idle',
          });

          // Auto-load first sample patient if none loaded
          if (!get().patient && patientsRes.length > 0) {
            await get().loadSample(patientsRes[0].id);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          set({ status: 'error', errorMessage: msg });
          console.error('[CardioTwin AppStore] Init failed:', msg);
        }
      },

      /**
       * Load a sample patient by ID, set patient and baseline working copies,
       * and trigger immediate prediction and vessel explanation.
       */
      loadSample: async (id: number) => {
        set({ status: 'loading', errorMessage: null, currentPatientId: id });
        try {
          const patientDetail = await api.getPatient(id);
          const features = { ...patientDetail.features };
          const predRes = await api.predict(features);

          set({
            patient: features,
            baseline: { ...features },
            predictions: predRes.predictions,
            baselinePredictions: { ...predRes.predictions },
            patientSummary: patientDetail.summary,
            patientRiskTier: patientDetail.risk_tier,
          });

          // Fetch explanation for active vessel
          await get().explain(get().selectedVessel, false);

          set({ status: 'idle' });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          set({ status: 'error', errorMessage: msg });
          console.error(`[CardioTwin AppStore] loadSample(${id}) failed:`, msg);
        }
      },

      /**
       * Updates a feature in the working patient feature vector,
       * then debounces a prediction (300ms) for real-time What-If exploration.
       */
      setFeature: (name: string, value: number | string) => {
        const currentPatient = get().patient || {};
        const updatedPatient = { ...currentPatient, [name]: value };

        // Update working copy immediately
        set({ patient: updatedPatient });

        // Trigger debounced prediction
        get().predict();
      },

      /**
       * Debounced prediction call (300ms) to prevent API flooding during slider dragging.
       */
      predict: () => {
        const existingTimer = get()._debounceTimer;
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        set({ isPredicting: true });

        const timer = setTimeout(async () => {
          await get().predictImmediate();
          // Also refresh fast explanation for currently active vessel
          get().explain(get().selectedVessel, true);
        }, 300);

        set({ _debounceTimer: timer });
      },

      /**
       * Executes immediate prediction using current working patient feature vector.
       */
      predictImmediate: async () => {
        const patientData = get().patient;
        if (!patientData) return;

        set({ isPredicting: true });
        try {
          const res = await api.predict(patientData);
          set({ predictions: res.predictions, isPredicting: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[CardioTwin AppStore] predictImmediate failed:', msg);
          set({ isPredicting: false });
        }
      },

      /**
       * Selects an anatomical vessel target ('LAD' | 'LCX' | 'RCA' | null for whole heart),
       * and fetches its SHAP explanation.
       */
      selectVessel: async (target: Target | null) => {
        set({
          selectedVessel: target,
          isCrossSectionOpen: target !== null,
        });
        await get().explain(target, false);
      },

      /**
       * Calls the explainability engine (SHAP) for the target (defaults to selectedVessel or CAD).
       */
      explain: async (targetOverride?: Target | null, fast: boolean = false) => {
        const patientData = get().patient;
        if (!patientData) return;

        const activeTarget = (targetOverride !== undefined ? targetOverride : get().selectedVessel) || 'CAD';

        set({ isExplaining: true });
        try {
          const explanationRes = await api.explain(patientData, activeTarget, fast);
          set({ explanation: explanationRes, isExplaining: false });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[CardioTwin AppStore] explain(${activeTarget}) failed:`, msg);
          set({ isExplaining: false });
        }
      },

      /**
       * Resets working patient to baseline snapshot and recalculates predictions.
       */
      resetWhatIf: async () => {
        const baselineData = get().baseline;
        if (!baselineData) return;

        set({
          patient: { ...baselineData },
          status: 'loading',
        });

        await Promise.all([
          get().predictImmediate(),
          get().explain(get().selectedVessel, false),
        ]);

        set({ status: 'idle' });
      },

      /**
       * Derived helper: Maps target prediction probability to continuous Hex risk color.
       * Respects projectionPredictions during active trajectory scrub/animation.
       */
      colorFor: (target: Target) => {
        const preds =
          get().isProjectionMode && get().projectionPredictions
            ? get().projectionPredictions
            : get().predictions;
        if (!preds || !preds[target]) {
          return '#0d9488'; // Default teal if no predictions yet
        }
        return riskGradient(preds[target].probability);
      },

      setProjectionMode: (active) =>
        set((state) => ({
          isProjectionMode: active,
          projectionPredictions: active ? state.projectionPredictions : null,
        })),

      setProjectionPredictions: (preds) =>
        set({
          projectionPredictions: preds,
          isProjectionMode: Boolean(preds),
        }),

      // UI Actions
      setQuality: (quality) => set({ quality }),

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          }
        }
      },

      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(nextTheme);
      },

      toggleAngiogramMode: () => set((state) => ({ isAngiogramMode: !state.isAngiogramMode })),
      setAngiogramMode: (active: boolean) => set({ isAngiogramMode: active }),
      toggleCrossSection: () => set((state) => ({ isCrossSectionOpen: !state.isCrossSectionOpen })),
      setCrossSectionOpen: (open: boolean) => set({ isCrossSectionOpen: open }),
      toggleCompareMode: () =>
        set((state) => {
          const next = !state.isCompareMode;
          return {
            isCompareMode: next,
            // Keep performance sane in compare mode by dropping to balanced if currently cinematic
            quality: next && state.quality === 'cinematic' ? 'balanced' : state.quality,
          };
        }),
      setCompareMode: (compare: boolean) =>
        set((state) => ({
          isCompareMode: compare,
          quality: compare && state.quality === 'cinematic' ? 'balanced' : state.quality,
        })),
      setCameraPreset: (preset) => set({ cameraPreset: preset }),

      playIntro: () => {
        set((state) => ({
          isIntroPlaying: true,
          introKey: state.introKey + 1,
          selectedVessel: null,
          cameraPreset: null,
        }));
      },

      skipIntro: () => {
        set({ isIntroPlaying: false });
      },

      toggleAudio: () => set((state) => ({ isAudioEnabled: !state.isAudioEnabled })),

      setDisclaimerAcknowledged: (ack) =>
        set({ disclaimerAcknowledged: ack, isDisclaimerModalOpen: false }),

      openDisclaimerModal: () => set({ isDisclaimerModalOpen: true }),
      closeDisclaimerModal: () => set({ isDisclaimerModalOpen: false }),

      openModelTrust: () => set({ isModelTrustOpen: true }),
      closeModelTrust: () => set({ isModelTrustOpen: false }),

      setActiveSection: (section) => {
        const mobileMap: Record<AppSection, MobileTab> = {
          heart: 'heart',
          inputs: 'inputs',
          metrics: 'results',
          split: 'heart',
        };
        set({ activeSection: section, activeMobileTab: mobileMap[section] });
      },

      setActiveMobileTab: (tab) => {
        const secMap: Record<MobileTab, AppSection> = {
          heart: 'heart',
          inputs: 'inputs',
          results: 'metrics',
        };
        set({ activeMobileTab: tab, activeSection: secMap[tab] });
      },

      clearPatient: () =>
        set({
          currentPatientId: null,
          patient: null,
          baseline: null,
          patientSummary: null,
          patientRiskTier: null,
          predictions: null,
          baselinePredictions: null,
          explanation: null,
          selectedVessel: null,
        }),
    }),
    {
      name: 'cardiotwin_app_state',
      partialize: (state) => ({
        quality: state.quality,
        theme: state.theme,
        disclaimerAcknowledged: state.disclaimerAcknowledged,
      }),
    }
  )
);
