import { CardioApi } from './types';
import { mockApi } from './mockApi';
import { httpApi } from './httpApi';

/**
 * Single source of truth API client export.
 * Toggled via VITE_USE_MOCK environment variable.
 * Default is true (Mock-First architecture).
 */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const isMockActive = useMock;

export const api: CardioApi = useMock ? mockApi : httpApi;

export * from './types';
export { mockApi } from './mockApi';
export { httpApi } from './httpApi';
