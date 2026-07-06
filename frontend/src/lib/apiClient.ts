import axios from 'axios';

function normalizeApiBaseUrl(value?: string) {
  const fallback = 'http://localhost:8080/api';
  if (!value) {
    return fallback;
  }

  let normalized = value.trim().replace(/\/+$/, '');
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  if (!normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }
  return normalized;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
    }
    return Promise.reject(error);
  }
);

export function assetUrl(path?: string) {
  if (!path) {
    return undefined;
  }
  if (path.startsWith('http')) {
    return path;
  }
  return `${FILE_BASE_URL}${path}`;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as { message?: string; details?: string[] } | string | undefined;
  if (typeof data === 'string' && data.trim()) {
    return data.trim().slice(0, 220);
  }
  if (!data && error.response?.status) {
    return `${error.response.status}: ${fallback}`;
  }
  if (!error.response) {
    return `${error.message}. API: ${API_BASE_URL}`;
  }
  if (typeof data !== 'object') {
    return fallback;
  }
  if (data?.details?.length) {
    return data.details.join(', ');
  }
  return data?.message || fallback;
}
