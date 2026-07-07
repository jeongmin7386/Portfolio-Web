import { apiClient } from '../../lib/apiClient';
import type { AuthResponse, UserSummary } from '../../lib/types';

export type SignupPayload = {
  email: string;
  password: string;
  name: string;
  portfolioSlug: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function signup(payload: SignupPayload) {
  localStorage.removeItem('accessToken');
  const { data } = await apiClient.post<AuthResponse>('/auth/signup', payload);
  localStorage.setItem('accessToken', data.accessToken);
  return data;
}

export async function login(payload: LoginPayload) {
  localStorage.removeItem('accessToken');
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  localStorage.setItem('accessToken', data.accessToken);
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<UserSummary>('/me');
  return data;
}

export function logout() {
  localStorage.removeItem('accessToken');
}
