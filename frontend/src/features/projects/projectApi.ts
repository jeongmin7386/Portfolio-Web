import { apiClient } from '../../lib/apiClient';
import type { Project, ProjectPayload } from '../../lib/types';

export async function listProjects() {
  const { data } = await apiClient.get<Project[]>('/admin/projects');
  return data;
}

export async function getProject(id: number) {
  const { data } = await apiClient.get<Project>(`/admin/projects/${id}`);
  return data;
}

export async function createProject(payload: ProjectPayload) {
  const { data } = await apiClient.post<Project>('/admin/projects', payload);
  return data;
}

export async function updateProject(id: number, payload: ProjectPayload) {
  const { data } = await apiClient.patch<Project>(`/admin/projects/${id}`, payload);
  return data;
}

export async function deleteProject(id: number) {
  await apiClient.delete(`/admin/projects/${id}`);
}

export async function uploadThumbnail(projectId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<Project>(`/admin/projects/${projectId}/thumbnail`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return data;
}
