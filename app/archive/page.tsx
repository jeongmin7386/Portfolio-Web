import type { Metadata } from "next";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import {
  getAllNotes,
  getAllProjects,
  getPublishedBuilderPage
} from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedBuilderPage("archive");

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription
  };
}

export default async function ArchivePage() {
  const [page, projects, notes] = await Promise.all([
    getPublishedBuilderPage("archive"),
    getAllProjects(),
    getAllNotes()
  ]);

  return (
    <BuilderPageRenderer
      notes={notes}
      page={page}
      projectBasePath="/projects"
      projects={projects}
    />
  );
}
