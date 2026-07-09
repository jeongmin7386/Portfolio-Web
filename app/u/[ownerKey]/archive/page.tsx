import type { Metadata } from "next";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import {
  getAllNotes,
  getAllProjects,
  getPublishedBuilderPage,
  normalizeContentOwnerKey
} from "@/lib/content";

export const dynamic = "force-dynamic";

type UserArchivePageProps = {
  params: Promise<{
    ownerKey: string;
  }>;
};

export async function generateMetadata({
  params
}: UserArchivePageProps): Promise<Metadata> {
  const { ownerKey: rawOwnerKey } = await params;
  const ownerKey = normalizeContentOwnerKey(rawOwnerKey);
  const page = await getPublishedBuilderPage("archive", ownerKey);

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription
  };
}

export default async function UserArchivePage({ params }: UserArchivePageProps) {
  const { ownerKey: rawOwnerKey } = await params;
  const ownerKey = normalizeContentOwnerKey(rawOwnerKey);
  const projectBasePath = `/u/${ownerKey}/projects`;
  const [page, projects, notes] = await Promise.all([
    getPublishedBuilderPage("archive", ownerKey),
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
