import { apiClient } from '../../lib/apiClient';
import type { PublicPortfolio } from '../../lib/types';

export async function getPublicPortfolio(slug: string, category?: string | null) {
  const { data } = await apiClient.get<PublicPortfolio>(`/public/portfolios/${slug}`, {
    params: category ? { category } : undefined
  });
  return data;
}

export async function getPublicProject(slug: string, projectSlug: string) {
  const { data } = await apiClient.get<PublicPortfolio['projects'][number]>(`/public/portfolios/${slug}/projects/${projectSlug}`);
  return data;
}
