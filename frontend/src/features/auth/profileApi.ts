import { apiClient } from '../../lib/apiClient';
import type { Profile } from '../../lib/types';

export type ProfilePayload = {
  slug: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  theme: string;
  publicProfile: boolean;
};

export async function getProfile() {
  const { data } = await apiClient.get<Profile>('/admin/profile');
  return data;
}

export async function updateProfile(payload: ProfilePayload) {
  const { data } = await apiClient.patch<Profile>('/admin/profile', payload);
  return data;
}
