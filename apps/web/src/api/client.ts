/**
 * Typed API client for the inventory backend.
 * Response/DTO types are defined in src/types/api.d.ts — API contracts are explicit.
 */
import axios, { type AxiosInstance } from 'axios';
import { getToken, clearToken } from './auth';
import { getOnUnauthorized } from './onUnauthorized';

export const api: AxiosInstance = axios.create({
  ...(import.meta.env.MODE === 'demo' ? { adapter: async (config) => (await import('./demo')).demoAdapter(config) } : {}),
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      const redirect = getOnUnauthorized();
      if (redirect) redirect();
      else window.location.href = '/login';
      return Promise.reject(new Error('Unauthorized'));
    }
    const data = err.response?.data;
    const message =
      (typeof data === 'object' && data !== null && data.message) ||
      (Array.isArray(data) && data[0]?.message) ||
      err.message;
    return Promise.reject(new Error(message));
  }
);
