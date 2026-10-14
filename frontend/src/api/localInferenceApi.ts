/**
 * CardioTwin Real In-Browser Static ML Inference Engine
 * Implements CardioApi without external Python/REST runtime.
 * Evaluates Calibrated Logistic Regression and exact linear SHAP attributions in JavaScript.
 */

import {
  CardioApi,
  FeatureSchema,
  SamplePatientSummary,
  SamplePatientDetail,
  PredictResponse,
  Explanation,
  MetricsBundle,
  HealthResponse,
  Target,
  Contribution,
} from './types';
import {
  MOCK_SCHEMA,
  MOCK_SAMPLE_PATIENTS,
  MOCK_METRICS,
} from './mockData';

export interface ModelSpec {
  target: Target;
  display_name: string;
  model_type: string;
  version: string;
  weights: number[];
  intercept: number;
  calibration: {
    method: string;
    a: number;
    b: number;
  };
  feature_order: string[];
  preprocessing: {
    numeric_means: Record<string, number>;
    numeric_stds: Record<string, number>;
    binary_features: string[];
    nominal_categories: Record<string, string[]>;
  };
  performance: {
    roc_auc: number;
    roc_auc_std: number;
    accuracy: number;
    f1: number;
    precision: number;
    recall: number;
  };
}

export type ModelsBundle = Record<Target, ModelSpec>;

interface PopulationStat {
  type: string;
  mean?: number;
  std?: number;
  median?: number;
  min?: number;
  max?: number;
  prevalence?: number;
  distribution?: Record<string, number>;
  display: string;
}

export class LocalInferenceApi implements CardioApi {
  private models: ModelsBundle | null = null;
  private schema: FeatureSchema | null = null;
  private populationRef: Record<string, PopulationStat> | null = null;
  private metrics: MetricsBundle | null = null;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private startTime: number = Date.now();

  /**
   * Asynchronously loads static model artifacts from /model/
   */
  private async loadArtifacts(): Promise<void> {
    try {
      const [modelsRes, schemaRes, popRes, metricsRes] = await Promise.all([
        fetch('/model/models.json'),
        fetch('/model/feature_schema.json'),
        fetch('/model/population_reference.json'),
        fetch('/model/metrics.json'),
      ]);

      if (!modelsRes.ok || !schemaRes.ok) {
        throw new Error(`Failed to load static model artifacts: models=${modelsRes.status}, schema=${schemaRes.status}`);
      }

      this.models = (await modelsRes.json()) as ModelsBundle;
      this.schema = (await schemaRes.json()) as FeatureSchema;

      if (popRes.ok) {
        this.populationRef = (await popRes.json()) as Record<string, PopulationStat>;
      }
      if (metricsRes.ok) {
        this.metrics = (await metricsRes.json()) as MetricsBundle;
      }

      this.isLoaded = true;
      console.info('[LocalInferenceApi] Static ML models and schema loaded successfully.');
    } catch (err) {
      console.warn('[LocalInferenceApi] Failed to load /model artifacts, falling back to mock schema/metrics:', err);
      this.schema = MOCK_SCHEMA;
      this.metrics = MOCK_METRICS;
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    if (!this.loadPromise) {
      this.loadPromise = this.loadArtifacts();
    }
    await this.loadPromise;
  }

  async getHealth(): Promise<HealthResponse> {
    await this.ensureLoaded();
    return {
      status: this.models ? 'ok' : 'degraded',
      model_version: '1.0.0-client-lr',
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      models_loaded: ['CAD', 'LAD', 'LCX', 'RCA'],
    };
  }

  async getSchema(): Promise<FeatureSchema> {
    await this.ensureLoaded();
    return this.schema || MOCK_SCHEMA;
  }

  async getPatients(): Promise<SamplePatientSummary[]> {
    return MOCK_SAMPLE_PATIENTS.map(({ features: _, ...summary }) => summary);
  }

  async getPatient(id: number): Promise<SamplePatientDetail> {
    const patient = MOCK_SAMPLE_PATIENTS.find((p) => p.id === id);
    if (!patient) {
      throw new Error(`Patient with ID ${id} not found.`);
    }
    return patient;
  }

  /**
   * Transforms raw patient features into preprocessed feature vector matching model.feature_order
   */
  private transformFeatures(
    features: Record<string, number | string>,
    model: ModelSpec
  ): { vector: number[]; rawValues: Record<string, number | string> } {
    const { numeric_means, numeric_stds, binary_features, nominal_categories } = model.preprocessing;
    const vector: number[] = [];
    const rawValues: Record<string, number | string> = {};

    // 1. Numeric and Ordinal Features (StandardScaler: (x - mean) / std)
    const numericKeys = Object.keys(numeric_means);
    for (const key of numericKeys) {
      const raw = features[key];
      const mean = numeric_means[key] ?? 0;
      const std = numeric_stds[key] ?? 1;
      const val = typeof raw === 'number' ? raw : (raw != null && !isNaN(Number(raw)) ? Number(raw) : mean);
      rawValues[key] = val;
      const scaled = std > 0 ? (val - mean) / std : 0;
      vector.push(scaled);
    }

    // 2. Binary Features (0.0 or 1.0)
    for (const key of binary_features) {
      const raw = features[key];
      const isPositive = raw === 1 || raw === '1' || raw === 'Y' || raw === 'Yes' || raw === 'Male';
      rawValues[key] = isPositive ? 1 : 0;
      vector.push(isPositive ? 1.0 : 0.0);
    }

    // 3. Nominal Features (One-Hot Encoded)
    for (const [key, categories] of Object.entries(nominal_categories)) {
      const raw = String(features[key] ?? categories[0]);
      rawValues[key] = raw;
      for (const cat of categories) {
        vector.push(raw === cat ? 1.0 : 0.0);
      }
    }

    return { vector, rawValues };
  }

  /**
   * Computes calibrated probability for a target model
   */
  private predictTarget(
    features: Record<string, number | string>,
    model: ModelSpec
  ): { probability: number; logit: number; vector: number[] } {
    const { vector } = this.transformFeatures(features, model);
    const { weights, intercept, calibration } = model;

    // Linear decision function: z = sum(w_i * x_i) + b
    let logit = intercept;
    for (let i = 0; i < weights.length; i++) {
      logit += weights[i] * vector[i];
    }

    // Sigmoid Platt calibration: P = 1 / (1 + exp(a * z + b))
    const calibratedProb = 1.0 / (1.0 + Math.exp(calibration.a * logit + calibration.b));
    const clampedProb = Math.min(0.999, Math.max(0.001, calibratedProb));

    return { probability: clampedProb, logit, vector };
  }

  async predict(features: Record<string, number | string>): Promise<PredictResponse> {
    await this.ensureLoaded();
    const t0 = performance.now();

    if (!this.models) {
      throw new Error('[LocalInferenceApi] Models not loaded.');
    }

    const targets: Target[] = ['CAD', 'LAD', 'LCX', 'RCA'];
    const predictions: Record<Target, { label: 'CAD' | 'Normal' | 'Stenotic'; probability: number; confidence: number }> = {} as any;

    for (const target of targets) {
      const model = this.models[target];
      if (!model) continue;

      const { probability } = this.predictTarget(features, model);

      // Label assignment (0.50 decision threshold)
      let label: 'CAD' | 'Normal' | 'Stenotic';
      if (target === 'CAD') {
        label = probability >= 0.5 ? 'CAD' : 'Normal';
      } else {
        label = probability >= 0.5 ? 'Stenotic' : 'Normal';
      }

      // Statistical confidence derived from calibrated margin
      const margin = Math.abs(probability - 0.5) * 2; // 0 to 1
      const confidence = Number((0.55 + 0.40 * margin).toFixed(2));

      predictions[target] = {
        label,
        probability: Number(probability.toFixed(3)),
        confidence,
      };
    }

    const inferenceTimeMs = Number((performance.now() - t0).toFixed(2));

    return {
      predictions,
      model_version: '1.0.0-client-lr',
      warnings: [],
      inference_time_ms: inferenceTimeMs,
    };
  }

  async explain(
    features: Record<string, number | string>,
    target: Target,
    _fast: boolean = false
  ): Promise<Explanation> {
    await this.ensureLoaded();

    if (!this.models) {
      throw new Error('[LocalInferenceApi] Models not loaded.');
    }

    const model = this.models[target];
    if (!model) {
      throw new Error(`[LocalInferenceApi] Model for ${target} not found.`);
    }

    const { probability: targetPred, vector } = this.predictTarget(features, model);
    const { weights, preprocessing } = model;
    const { numeric_means, binary_features, nominal_categories } = preprocessing;

    // Feature Schema metadata map
    const schemaFeatureMap = new Map<string, { label: string; unit?: string }>();
    if (this.schema) {
      for (const f of this.schema.features) {
        schemaFeatureMap.set(f.name, { label: f.label, unit: f.unit });
      }
    }

    const contributions: Contribution[] = [];
    let vecIdx = 0;

    // 1. Numeric and Ordinal Features
    // contribution_i = w_i * (x_i_standardized - E[x_i_standardized])
    // Since StandardScaler ensures E[x_i_standardized] = 0, contribution_i = w_i * x_i_standardized
    for (const key of Object.keys(numeric_means)) {
      const w = weights[vecIdx];
      const x = vector[vecIdx];
      vecIdx++;

      const logitShap = w * x;
      const rawVal = features[key] ?? numeric_means[key];
      const meta = schemaFeatureMap.get(key);
      const displayLabel = meta?.label || key;
      const unit = meta?.unit ? ` ${meta.unit}` : '';
      const popDisplay = this.populationRef?.[key]?.display || 'Cohort reference';

      contributions.push({
        feature: displayLabel,
        value: `${rawVal}${unit}`,
        shap: Number(logitShap.toFixed(3)),
        direction: logitShap >= 0 ? 'increases' : 'decreases',
        population_reference: popDisplay,
      });
    }

    // 2. Binary Features
    // contribution_i = w_i * (b_i - E[b_i]), where E[b_i] = prevalence
    for (const key of binary_features) {
      const w = weights[vecIdx];
      const b = vector[vecIdx];
      vecIdx++;

      const prevalence = this.populationRef?.[key]?.prevalence ?? 0.5;
      const logitShap = w * (b - prevalence);
      const rawVal = features[key];
      const isPositive = rawVal === 1 || rawVal === '1' || rawVal === 'Y' || rawVal === 'Yes' || rawVal === 'Male';
      const meta = schemaFeatureMap.get(key);
      const displayLabel = meta?.label || key;
      const valStr = key === 'Sex' ? (isPositive ? 'Male' : 'Female') : (isPositive ? 'Yes / Present' : 'No / Absent');
      const popDisplay = this.populationRef?.[key]?.display || 'Population baseline';

      contributions.push({
        feature: displayLabel,
        value: valStr,
        shap: Number(logitShap.toFixed(3)),
        direction: logitShap >= 0 ? 'increases' : 'decreases',
        population_reference: popDisplay,
      });
    }

    // 3. Nominal Features (One-Hot Encoded)
    for (const [key, categories] of Object.entries(nominal_categories)) {
      let activeCat = String(features[key] ?? categories[0]);
      let activeShap = 0;

      for (const cat of categories) {
        const w = weights[vecIdx];
        const isActive = vector[vecIdx];
        vecIdx++;

        const dist = this.populationRef?.[key]?.distribution?.[cat] ?? (1.0 / categories.length);
        const catShap = w * (isActive - dist);
        if (isActive === 1.0) {
          activeShap = catShap;
          activeCat = cat;
        }
      }

      const meta = schemaFeatureMap.get(key);
      const displayLabel = meta?.label || key;
      const popDisplay = this.populationRef?.[key]?.display || 'Rhythm distribution';

      contributions.push({
        feature: displayLabel,
        value: activeCat,
        shap: Number(activeShap.toFixed(3)),
        direction: activeShap >= 0 ? 'increases' : 'decreases',
        population_reference: popDisplay,
      });
    }

    // Sort contributions by absolute SHAP magnitude descending
    contributions.sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));

    // Base value in probability space
    const baseLogit = model.intercept;
    const baseVal = Number((1.0 / (1.0 + Math.exp(model.calibration.a * baseLogit + model.calibration.b))).toFixed(2));

    // Templated clinical narrative from top SHAP contributors
    const topPos = contributions.filter((c) => c.direction === 'increases').slice(0, 2);
    const topNeg = contributions.filter((c) => c.direction === 'decreases').slice(0, 1);
    
    let narrative = '';
    if (topPos.length > 0) {
      narrative = `Elevated ${target} risk (${(targetPred * 100).toFixed(0)}%) is primarily driven by ${topPos.map((c) => c.feature).join(' and ')}`;
      if (topNeg.length > 0 && Math.abs(topNeg[0].shap) > 0.05) {
        narrative += `, partially mitigated by favorable ${topNeg[0].feature}`;
      }
      narrative += '.';
    } else {
      narrative = `Low ${target} risk (${(targetPred * 100).toFixed(0)}%) is supported by normal hemodynamics and absence of ischemic markers.`;
    }

    return {
      target,
      base_value: baseVal,
      prediction: Number(targetPred.toFixed(3)),
      contributions,
      narrative,
      generated_at: new Date().toISOString(),
    };
  }

  async getMetrics(): Promise<MetricsBundle> {
    await this.ensureLoaded();
    return this.metrics || MOCK_METRICS;
  }
}

export const localInferenceApi = new LocalInferenceApi();
