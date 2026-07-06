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
  const { data } = await apiClient.patch<SiteResponse>('/builder/site', payload);
  return data;
}

export async function createPage(payload: PagePayload) {
  const { data } = await apiClient.post<SitePage>('/builder/pages', payload);
  return data;
}

export async function updatePage(pageId: number, payload: PagePayload) {
  const { data } = await apiClient.patch<SitePage>(`/builder/pages/${pageId}`, payload);
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
  const { data } = await apiClient.post<BuilderProject>('/builder/projects', payload);
  return data;
}

export async function updateBuilderProject(projectId: number, payload: BuilderProjectPayload) {
  const { data } = await apiClient.patch<BuilderProject>(`/builder/projects/${projectId}`, payload);
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
  const { data } = await apiClient.post<SiteBlock>(`/builder/pages/${pageId}/blocks`, payload);
  return data;
}

export async function updateBlock(pageId: number, blockId: number, payload: BlockPayload) {
  const { data } = await apiClient.patch<SiteBlock>(`/builder/pages/${pageId}/blocks/${blockId}`, payload);
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
  const { data } = await apiClient.post<SiteBlock>(`/builder/projects/${projectId}/blocks`, payload);
  return data;
}

export async function updateProjectBlock(projectId: number, blockId: number, payload: BlockPayload) {
  const { data } = await apiClient.patch<SiteBlock>(`/builder/projects/${projectId}/blocks/${blockId}`, payload);
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
