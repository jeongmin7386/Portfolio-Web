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
  const requestUrl = config.url ?? '';
  if (requestUrl.startsWith('/auth/')) {
    return config;
  }

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
    return translateApiMessage(data.trim()).slice(0, 220);
  }
  if (!data && error.response?.status) {
    return `${error.response.status}: ${fallback}`;
  }
  if (!error.response) {
    return `서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요. API: ${API_BASE_URL}`;
  }
  if (typeof data !== 'object') {
    return fallback;
  }
  if (data?.details?.length) {
    return data.details.map(translateApiMessage).join(', ');
  }
  return translateApiMessage(data?.message || fallback);
}

function translateApiMessage(message: string) {
  const normalized = message.trim();
  const dictionary: Record<string, string> = {
    'Invalid credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email already exists': '이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해주세요.',
    'Portfolio slug already exists': '이미 사용 중인 공개 주소입니다. 다른 주소를 입력해주세요.',
    'Invalid request': '입력값을 다시 확인해주세요.',
    'Unexpected server error': '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    'Token expired': '로그인 시간이 만료되었습니다. 다시 로그인해주세요.',
    'Invalid token': '로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.',
    'Invalid token signature': '로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.'
  };
  if (dictionary[normalized]) {
    return dictionary[normalized];
  }
  if (normalized.includes('password: size must be between 8 and 100')) {
    return '비밀번호는 8자 이상 100자 이하로 입력해주세요.';
  }
  if (normalized.includes('email:')) {
    return '올바른 이메일 주소를 입력해주세요.';
  }
  if (normalized.includes('portfolioSlug:')) {
    return '공개 주소를 입력해주세요.';
  }
  if (normalized.includes('name:')) {
    return '이름을 입력해주세요.';
  }
  return normalized;
}
