import type { Metadata } from "next";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import {
  getAllNotes,
  getAllProjects,
  getPublishedBuilderPage,
  normalizeContentOwnerKey
} from "@/lib/content";

export const dynamic = "force-dynamic";

type UserHomePageProps = {
  params: Promise<{
    ownerKey: string;
  }>;
};

export async function generateMetadata({
  params
}: UserHomePageProps): Promise<Metadata> {
  const { ownerKey: rawOwnerKey } = await params;
  const ownerKey = normalizeContentOwnerKey(rawOwnerKey);
  const page = await getPublishedBuilderPage("home", ownerKey);

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription
  };
}

export default async function UserHomePage({ params }: UserHomePageProps) {
  const { ownerKey: rawOwnerKey } = await params;
  const ownerKey = normalizeContentOwnerKey(rawOwnerKey);
  const projectBasePath = `/u/${ownerKey}/projects`;
  const [page, projects, notes] = await Promise.all([
    getPublishedBuilderPage("home", ownerKey),
    getAllProjects(ownerKey),
    getAllNotes(ownerKey)
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
