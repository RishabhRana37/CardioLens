import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Target, Prediction, Explanation, FeatureSchema, MetricsBundle } from '../api/types';

export type GraphicQuality = 'cinematic' | 'balanced' | 'performance';
export type AppTheme = 'dark' | 'light';
export type MobileTab = 'heart' | 'inputs' | 'results';

export interface AppState {
  // Application Settings & System Preferences (Persisted)
  quality: GraphicQuality;
  theme: AppTheme;
  disclaimerAcknowledged: boolean;

  // Modals & UI States
  isDisclaimerModalOpen: boolean;
  activeMobileTab: MobileTab;

  // Clinical & Anatomical Context
  schema: FeatureSchema | null;
  patient: Record<string, number | string> | null;
  patientSummary: string | null;
  patientRiskTier: 'high' | 'moderate' | 'low' | null;
  baselinePatient: Record<string, number | string> | null; // For What-If comparison

  // Predictions & Explainability
  predictions: Record<Target, Prediction> | null;
  explanation: Explanation | null;
  selectedVessel: Target | null; // null = CAD / whole heart
  metrics: MetricsBundle | null;
  status: 'idle' | 'loading' | 'error';
  errorMessage: string | null;

  // Actions
  setQuality: (quality: GraphicQuality) => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setDisclaimerAcknowledged: (ack: boolean) => void;
  openDisclaimerModal: () => void;
  closeDisclaimerModal: () => void;
  setActiveMobileTab: (tab: MobileTab) => void;
  setSelectedVessel: (vessel: Target | null) => void;
  setPatient: (patientData: Record<string, number | string>, summary?: string, tier?: 'high' | 'moderate' | 'low') => void;
  clearPatient: () => void;
  setStatus: (status: 'idle' | 'loading' | 'error', error?: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Defaults
      quality: 'cinematic',
      theme: 'dark',
      disclaimerAcknowledged: false,
      isDisclaimerModalOpen: false,
      activeMobileTab: 'heart',

      schema: null,
      patient: null,
      patientSummary: null,
      patientRiskTier: null,
      baselinePatient: null,
      predictions: null,
      explanation: null,
      selectedVessel: null,
      metrics: null,
      status: 'idle',
      errorMessage: null,

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

      setDisclaimerAcknowledged: (ack) =>
        set({ disclaimerAcknowledged: ack, isDisclaimerModalOpen: false }),

      openDisclaimerModal: () => set({ isDisclaimerModalOpen: true }),
      closeDisclaimerModal: () => set({ isDisclaimerModalOpen: false }),

      setActiveMobileTab: (tab) => set({ activeMobileTab: tab }),

      setSelectedVessel: (vessel) => set({ selectedVessel: vessel }),

      setPatient: (patientData, summary, tier) =>
        set({
          patient: patientData,
          baselinePatient: { ...patientData },
          patientSummary: summary || 'Custom Patient Profile',
          patientRiskTier: tier || 'moderate',
        }),

      clearPatient: () =>
        set({
          patient: null,
          baselinePatient: null,
          patientSummary: null,
          patientRiskTier: null,
          predictions: null,
          explanation: null,
          selectedVessel: null,
        }),

      setStatus: (status, error = null) =>
        set({ status, errorMessage: error }),
    }),
    {
      name: 'cardiotwin_app_state',
      // Only persist specific user settings across browser reload
      partialize: (state) => ({
        quality: state.quality,
        theme: state.theme,
        disclaimerAcknowledged: state.disclaimerAcknowledged,
      }),
    }
  )
);
