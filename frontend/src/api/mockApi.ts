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
} from './types';
import {
  MOCK_SCHEMA,
  MOCK_SAMPLE_PATIENTS,
  MOCK_METRICS,
  generateMockPredictions,
  generateMockExplanation,
} from './mockData';

export class MockCardioApi implements CardioApi {
  private artificialDelay(ms: number = 50): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getHealth(): Promise<HealthResponse> {
    await this.artificialDelay(30);
    return {
      status: 'ok',
      model_version: '1.0.0-mock',
      uptime_seconds: 3600,
      models_loaded: ['CAD', 'LAD', 'LCX', 'RCA'],
    };
  }

  async getSchema(): Promise<FeatureSchema> {
    await this.artificialDelay(40);
    return MOCK_SCHEMA;
  }

  async getPatients(): Promise<SamplePatientSummary[]> {
    await this.artificialDelay(40);
    return MOCK_SAMPLE_PATIENTS.map(({ features: _, ...summary }) => summary);
  }

  async getPatient(id: number): Promise<SamplePatientDetail> {
    await this.artificialDelay(50);
    const patient = MOCK_SAMPLE_PATIENTS.find((p) => p.id === id);
    if (!patient) {
      throw new Error(`Patient with ID ${id} not found.`);
    }
    return patient;
  }

  async predict(features: Record<string, number | string>): Promise<PredictResponse> {
    await this.artificialDelay(60);
    return generateMockPredictions(features);
  }

  async explain(
    features: Record<string, number | string>,
    target: Target,
    fast: boolean = false
  ): Promise<Explanation> {
    await this.artificialDelay(fast ? 25 : 80);
    return generateMockExplanation(features, target);
  }

  async getMetrics(): Promise<MetricsBundle> {
    await this.artificialDelay(50);
    return MOCK_METRICS;
  }
}

export const mockApi = new MockCardioApi();
