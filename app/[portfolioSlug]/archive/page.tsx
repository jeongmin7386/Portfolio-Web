import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import {
  getAllNotes,
  getAllProjects,
  getPublishedBuilderPage,
  getPublishedPortfolioByPublicSlug
} from "@/lib/content";

export const dynamic = "force-dynamic";

type PublicPortfolioArchivePageProps = {
  params: Promise<{
    portfolioSlug: string;
  }>;
};

export async function generateMetadata({
  params
}: PublicPortfolioArchivePageProps): Promise<Metadata> {
  const { portfolioSlug } = await params;
  const portfolio = await getPublishedPortfolioByPublicSlug(portfolioSlug);

  if (!portfolio) {
    return {
      title: "아카이브를 찾을 수 없습니다"
    };
  }

  const page = await getPublishedBuilderPage("archive", portfolio.ownerKey);

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription
  };
}

export default async function PublicPortfolioArchivePage({
  params
}: PublicPortfolioArchivePageProps) {
  const { portfolioSlug } = await params;
  const portfolio = await getPublishedPortfolioByPublicSlug(portfolioSlug);

  if (!portfolio) {
    notFound();
  }

  const projectBasePath = `/${portfolio.publicSlug}/projects`;
  const [page, projects, notes] = await Promise.all([
    getPublishedBuilderPage("archive", portfolio.ownerKey),
    getAllProjects(portfolio.ownerKey),
    getAllNotes(portfolio.ownerKey)
  ]);

  return (
    <BuilderPageRenderer
      notes={notes}
      page={page}
      projectBasePath={projectBasePath}
      projects={projects}
    />
  );
}
