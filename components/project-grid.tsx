import { ProjectCard } from "@/components/project-card";
import type { Project } from "@/lib/types";

type ProjectGridProps = {
  projects: Project[];
  projectBasePath?: string;
};

export function ProjectGrid({
  projects,
  projectBasePath = "/projects"
}: ProjectGridProps) {
  if (!projects.length) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        표시할 프로젝트가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.slug}
          priority={index < 2}
          project={project}
          projectBasePath={projectBasePath}
        />
      ))}
    </div>
  );
}
