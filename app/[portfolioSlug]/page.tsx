import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import {
  getAllNotes,
  getAllProjects,
  getPublishedPortfolioByPublicSlug
} from "@/lib/content";

export const dynamic = "force-dynamic";

type PublicPortfolioPageProps = {
  params: Promise<{
    portfolioSlug: string;
  }>;
};

export async function generateMetadata({
  params
}: PublicPortfolioPageProps): Promise<Metadata> {
  const { portfolioSlug } = await params;
  const portfolio = await getPublishedPortfolioByPublicSlug(portfolioSlug);

  if (!portfolio) {
    return {
      title: "포트폴리오를 찾을 수 없습니다"
    };
  }

  return {
    title: portfolio.page.seoTitle || portfolio.page.title,
    description: portfolio.page.seoDescription
  };
}

export default async function PublicPortfolioPage({
  params
}: PublicPortfolioPageProps) {
  const { portfolioSlug } = await params;
  const portfolio = await getPublishedPortfolioByPublicSlug(portfolioSlug);

  if (!portfolio) {
    notFound();
  }

  const projectBasePath = `/${portfolio.publicSlug}/projects`;
  const [projects, notes] = await Promise.all([
    getAllProjects(portfolio.ownerKey),
    getAllNotes(portfolio.ownerKey)
  ]);

  return (
    <BuilderPageRenderer
      notes={notes}
      page={portfolio.page}
      projectBasePath={projectBasePath}
      projects={projects}
    />
  );
}
