import { apiClient } from '../../lib/apiClient';
import type { Category } from '../../lib/types';

export async function listCategories() {
  const { data } = await apiClient.get<Category[]>('/admin/categories');
  return data;
}

export async function createCategory(payload: { name: string; sortOrder?: number }) {
  const { data } = await apiClient.post<Category>('/admin/categories', payload);
  return data;
}

export async function updateCategory(id: number, payload: { name: string; sortOrder?: number }) {
  const { data } = await apiClient.patch<Category>(`/admin/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: number) {
  await apiClient.delete(`/admin/categories/${id}`);
}
