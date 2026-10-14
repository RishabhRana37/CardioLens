import { CardioApi } from './types';
import { mockApi } from './mockApi';
import { httpApi } from './httpApi';
import { localInferenceApi } from './localInferenceApi';

/**
 * Single source of truth API client export.
 * Toggled via VITE_USE_MOCK environment variable:
 * - 'false' (or unset/production default): selects localInferenceApi (real, client-side static ML)
 * - 'http': selects httpApi (external REST backend)
 * - 'true': selects mockApi (emergency fallback only)
 */
const mockEnv = import.meta.env.VITE_USE_MOCK;
const isHttp = mockEnv === 'http';
const isMock = mockEnv === 'true';

export const isMockActive = isMock;

export const api: CardioApi = isMock
  ? mockApi
  : (isHttp ? httpApi : localInferenceApi);

export * from './types';
export { mockApi } from './mockApi';
export { httpApi } from './httpApi';
export { localInferenceApi } from './localInferenceApi';

