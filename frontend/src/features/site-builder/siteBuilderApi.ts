import { apiClient } from '../../lib/apiClient';
import type {
  BlockPayload,
  BuilderProject,
  BuilderProjectPayload,
  BuilderState,
  PagePayload,
  PageWithBlocks,
  ProjectWithBlocks,
  SiteBlock,
  SitePage,
  SiteRender,
  SiteResponse
} from './types';

function logRequest(label: string, payload: unknown) {
  console.log(`[builder:request] ${label}`, payload);
}

function logResponse(label: string, payload: unknown) {
  console.log(`[builder:response] ${label}`, payload);
}

export async function getBuilderState() {
  const { data } = await apiClient.get<BuilderState>('/builder');
  return data;
}

export async function updateSite(payload: {
  slug: string;
  title: string;
  description?: string;
  profileImageUrl?: string;
  published?: boolean;
  themeId?: number;
}) {
  logRequest('updateSite', payload);
  const { data } = await apiClient.patch<SiteResponse>('/builder/site', payload);
  logResponse('updateSite', data);
  return data;
}

export async function createPage(payload: PagePayload) {
  logRequest('createPage', payload);
  const { data } = await apiClient.post<SitePage>('/builder/pages', payload);
  logResponse('createPage', data);
  return data;
}

export async function updatePage(pageId: number, payload: PagePayload) {
  logRequest('updatePage', { pageId, payload });
  const { data } = await apiClient.patch<SitePage>(`/builder/pages/${pageId}`, payload);
  logResponse('updatePage', data);
  return data;
}

export async function deletePage(pageId: number) {
  await apiClient.delete(`/builder/pages/${pageId}`);
}

export async function listBuilderProjects() {
  const { data } = await apiClient.get<BuilderProject[]>('/builder/projects');
  return data;
}

export async function createBuilderProject(payload: BuilderProjectPayload) {
  logRequest('createBuilderProject', payload);
  const { data } = await apiClient.post<BuilderProject>('/builder/projects', payload);
  logResponse('createBuilderProject', data);
  return data;
}

export async function updateBuilderProject(projectId: number, payload: BuilderProjectPayload) {
  logRequest('updateBuilderProject', { projectId, payload });
  const { data } = await apiClient.patch<BuilderProject>(`/builder/projects/${projectId}`, payload);
  logResponse('updateBuilderProject', data);
  return data;
}

export async function deleteBuilderProject(projectId: number) {
  await apiClient.delete(`/builder/projects/${projectId}`);
}

export async function getPageWithBlocks(pageId: number) {
  const { data } = await apiClient.get<PageWithBlocks>(`/builder/pages/${pageId}`);
  return data;
}

export async function createBlock(pageId: number, payload: BlockPayload) {
  logRequest('createBlock', { pageId, payload });
  const { data } = await apiClient.post<SiteBlock>(`/builder/pages/${pageId}/blocks`, payload);
  logResponse('createBlock', data);
  return data;
}

export async function updateBlock(pageId: number, blockId: number, payload: BlockPayload) {
  logRequest('updateBlock', { pageId, blockId, payload });
  const { data } = await apiClient.patch<SiteBlock>(`/builder/pages/${pageId}/blocks/${blockId}`, payload);
  logResponse('updateBlock', data);
  return data;
}

export async function deleteBlock(pageId: number, blockId: number) {
  await apiClient.delete(`/builder/pages/${pageId}/blocks/${blockId}`);
}

export async function getProjectWithBlocks(projectId: number) {
  const { data } = await apiClient.get<ProjectWithBlocks>(`/builder/projects/${projectId}`);
  return data;
}

export async function createProjectBlock(projectId: number, payload: BlockPayload) {
  logRequest('createProjectBlock', { projectId, payload });
  const { data } = await apiClient.post<SiteBlock>(`/builder/projects/${projectId}/blocks`, payload);
  logResponse('createProjectBlock', data);
  return data;
}

export async function updateProjectBlock(projectId: number, blockId: number, payload: BlockPayload) {
  logRequest('updateProjectBlock', { projectId, blockId, payload });
  const { data } = await apiClient.patch<SiteBlock>(`/builder/projects/${projectId}/blocks/${blockId}`, payload);
  logResponse('updateProjectBlock', data);
  return data;
}

export async function deleteProjectBlock(projectId: number, blockId: number) {
  await apiClient.delete(`/builder/projects/${projectId}/blocks/${blockId}`);
}

export async function getPublicSite(slug?: string) {
  const { data } = await apiClient.get<SiteRender>(slug ? `/public/site/${slug}` : '/public/site');
  return data;
}

export async function getPublicBuilderProject(projectSlug: string, siteSlug?: string) {
  const { data } = await apiClient.get<ProjectWithBlocks>(siteSlug ? `/public/site/${siteSlug}/projects/${projectSlug}` : `/public/site/projects/${projectSlug}`);
  return data;
}
