import { apiClient } from '../../lib/apiClient';
import type { BlockPayload, BuilderState, PagePayload, PageWithBlocks, SiteBlock, SitePage, SiteRender, SiteResponse } from './types';

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

export async function getPublicSite(slug?: string) {
  const { data } = await apiClient.get<SiteRender>(slug ? `/public/site/${slug}` : '/public/site');
  return data;
}
