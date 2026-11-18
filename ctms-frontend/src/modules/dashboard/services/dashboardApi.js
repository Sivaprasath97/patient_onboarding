import { api } from '../../../shared/api/client.js';

export const dashboardApi = { get: () => api('/dashboard') };
