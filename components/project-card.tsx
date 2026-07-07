import Link from "next/link";
import Image from "next/image";

import { TagList } from "@/components/tag-list";
import type { Project } from "@/lib/types";

type ProjectCardProps = {
  project: Project;
  priority?: boolean;
};

export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  return (
    <Link
      className="group block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500"
      href={`/projects/${project.slug}`}
    >
      <article className="grid gap-4">
        <div className="aspect-[4/3] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
          <Image
            alt={project.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            height={900}
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={project.coverImage}
            unoptimized
            width={1200}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                {project.category}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-neutral-950 transition group-hover:text-emerald-700 dark:text-neutral-50 dark:group-hover:text-emerald-300">
                {project.title}
              </h3>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-500">
              {project.year}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {project.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-neutral-500 dark:text-neutral-500">
            <span>{project.role}</span>
          </div>
          <TagList compact tags={project.tags.slice(0, 4)} />
        </div>
      </article>
    </Link>
  );
}
