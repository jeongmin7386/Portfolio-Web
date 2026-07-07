import type { Metadata } from "next";

import { ProjectExplorer } from "@/components/project-explorer";
import { SectionTitle } from "@/components/section-title";
import { getAllProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse Studio Archive projects across branding, UI/UX, editorial, motion, and art direction."
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="pb-8 pt-8">
        <h1 className="font-display text-5xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-7xl">
          Projects
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 dark:text-neutral-300">
          A grid-based archive of selected work, designed to stay calm when the
          amount of content grows.
        </p>
      </section>
      <section className="pb-16">
        <SectionTitle
          description="Case studies across brand systems, product interfaces, publications, motion, and image direction."
          eyebrow="Archive"
          title="Case Study Index"
        />
        <ProjectExplorer projects={projects} />
      </section>
    </div>
  );
}
