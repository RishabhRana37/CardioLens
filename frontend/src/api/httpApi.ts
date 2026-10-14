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

export class HttpCardioApi implements CardioApi {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options?.headers || {}),
        },
        ...options,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status} [${endpoint}]: ${errorText || res.statusText}`);
      }

      return (await res.json()) as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[HttpCardioApi] Failed request to ${endpoint}:`, msg);
      throw new Error(`Backend Connection Error: ${msg}`);
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getSchema(): Promise<FeatureSchema> {
    return this.request<FeatureSchema>('/schema');
  }

  async getPatients(): Promise<SamplePatientSummary[]> {
    return this.request<SamplePatientSummary[]>('/patients');
  }

  async getPatient(id: number): Promise<SamplePatientDetail> {
    return this.request<SamplePatientDetail>(`/patients/${id}`);
  }

  async predict(features: Record<string, number | string>): Promise<PredictResponse> {
    return this.request<PredictResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify({ features }),
    });
  }

  async explain(
    features: Record<string, number | string>,
    target: Target,
    fast: boolean = false
  ): Promise<Explanation> {
    return this.request<Explanation>('/explain', {
      method: 'POST',
      body: JSON.stringify({ features, target, fast }),
    });
  }

  async getMetrics(): Promise<MetricsBundle> {
    return this.request<MetricsBundle>('/metrics');
  }
}

export const httpApi = new HttpCardioApi();
