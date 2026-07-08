import type { Metadata } from "next";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import { getAllNotes, getAllProjects, getBuilderPage } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getBuilderPage("home");

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription
  };
}

export default async function HomePage() {
  const [page, projects, notes] = await Promise.all([
    getBuilderPage("home"),
    getAllProjects(),
    getAllNotes()
  ]);

  return (
    <BuilderPageRenderer notes={notes} page={page} projects={projects} />
  );
}
