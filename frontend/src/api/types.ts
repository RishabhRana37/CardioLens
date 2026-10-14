/**
 * CardioTwin Canonical API Contract Types
 * Corresponds directly to PRD_Backend.md §6 and PRD_Frontend.md §3/§11.
 */

// Shared Target Anatomical Enum (NFR3 / TC3)
export type Target = 'CAD' | 'LAD' | 'LCX' | 'RCA';

export type VesselTarget = 'LAD' | 'LCX' | 'RCA';

export type FeatureType = 'numeric' | 'binary' | 'nominal' | 'ordinal';

export type FeatureGroup =
  | 'Demographic'
  | 'Symptom & Examination'
  | 'ECG'
  | 'Laboratory & Echo';

export interface FeatureField {
  name: string;
  label: string;
  type: FeatureType;
  group: FeatureGroup;
  unit?: string;
  min?: number;
  max?: number;
  options?: string[] | number[];
  default: number | string;
  modifiable?: boolean; // For What-If digital twin
  description?: string;
}

export interface FeatureSchema {
  features: FeatureField[];
  groups: FeatureGroup[];
  total_features: number;
}

export interface SamplePatientSummary {
  id: number;
  summary: string;
  actual_cad: 'CAD' | 'Normal';
  actual_lad?: 'Stenotic' | 'Normal';
  actual_lcx?: 'Stenotic' | 'Normal';
  actual_rca?: 'Stenotic' | 'Normal';
  risk_tier: 'high' | 'moderate' | 'low';
}

export interface SamplePatientDetail extends SamplePatientSummary {
  features: Record<string, number | string>;
}

export interface Prediction {
  label: 'CAD' | 'Normal' | 'Stenotic';
  probability: number; // Stenosis or CAD probability [0.0, 1.0]
  confidence: number;  // Statistical confidence score [0.0, 1.0]
}

export interface PredictResponse {
  predictions: Record<Target, Prediction>;
  model_version: string;
  warnings?: string[];
  inference_time_ms?: number;
}

export interface Contribution {
  feature: string;
  value: number | string;
  shap: number;
  direction: 'increases' | 'decreases';
  population_reference: string;
}

export interface Explanation {
  target: Target;
  base_value: number;
  prediction: number;
  contributions: Contribution[];
  narrative: string;
  generated_at?: string;
}

export interface TargetMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  cv: {
    roc_auc_mean: number;
    roc_auc_std: number;
  };
  plots: {
    roc: string;
    calibration: string;
    confusion: string;
  };
  top_features: Array<{
    feature: string;
    importance: number;
  }>;
}

export type MetricsBundle = Record<Target, TargetMetrics>;

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  model_version: string;
  uptime_seconds?: number;
  models_loaded: string[];
}

/**
 * CardioApi Interface
 * Defines all operations consumed by the UI. Both mockApi and httpApi implement this.
 */
export interface CardioApi {
  getHealth(): Promise<HealthResponse>;
  getSchema(): Promise<FeatureSchema>;
  getPatients(): Promise<SamplePatientSummary[]>;
  getPatient(id: number): Promise<SamplePatientDetail>;
  predict(features: Record<string, number | string>): Promise<PredictResponse>;
  explain(
    features: Record<string, number | string>,
    target: Target,
    fast?: boolean
  ): Promise<Explanation>;
  getMetrics(): Promise<MetricsBundle>;
}
