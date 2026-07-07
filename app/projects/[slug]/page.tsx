import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/block-renderer";
import { TagList } from "@/components/tag-list";
import {
  getAllProjects,
  getProjectBySlug,
  getProjectNeighbors
} from "@/lib/content";

type ProjectDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project not found"
    };
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: [project.coverImage]
    }
  };
}

export default async function ProjectDetailPage({
  params
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([
    getProjectBySlug(slug),
    getAllProjects()
  ]);

  if (!project) {
    notFound();
  }

  const { previous, next } = getProjectNeighbors(projects, project.slug);
  const details = [
    ["Role", project.role],
    ["Period", project.period],
    ["Client", project.client],
    ["Tools", project.tools.join(", ")],
    ["Deliverables", project.deliverables.join(", ")]
  ];

  return (
    <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="grid gap-10 pb-10 pt-8">
        <div className="max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            {project.category} / {project.year}
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-tight text-neutral-950 dark:text-neutral-50 md:text-7xl">
            {project.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
            {project.description}
          </p>
          <TagList className="mt-6" tags={project.tags} />
        </div>
        <div className="aspect-[16/9] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
          <Image
            alt={project.title}
            className="h-full w-full object-cover"
            height={900}
            priority
            sizes="100vw"
            src={project.coverImage}
            unoptimized
            width={1600}
          />
        </div>
      </header>

      <dl
        aria-label="Project summary"
        className="grid gap-4 border-y border-neutral-200 py-8 dark:border-neutral-800 md:grid-cols-5"
      >
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-500">
              {label}
            </dt>
            <dd className="mt-2 text-sm leading-6 text-neutral-900 dark:text-neutral-100">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="py-12">
        <BlockRenderer blocks={project.blocks} />
      </section>

      <nav
        aria-label="Project navigation"
        className="grid gap-4 border-t border-neutral-200 pt-8 dark:border-neutral-800 md:grid-cols-2"
      >
        {previous ? (
          <Link
            className="group rounded-md border border-neutral-200 bg-white p-5 transition hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
            href={`/projects/${previous.slug}`}
          >
            <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
              <ArrowLeft aria-hidden size={16} />
              Previous
            </span>
            <p className="mt-3 text-xl font-semibold text-neutral-950 group-hover:text-emerald-700 dark:text-neutral-50 dark:group-hover:text-emerald-300">
              {previous.title}
            </p>
          </Link>
        ) : null}
        {next ? (
          <Link
            className="group rounded-md border border-neutral-200 bg-white p-5 text-right transition hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
            href={`/projects/${next.slug}`}
          >
            <span className="inline-flex items-center justify-end gap-2 text-sm text-neutral-500">
              Next
              <ArrowRight aria-hidden size={16} />
            </span>
            <p className="mt-3 text-xl font-semibold text-neutral-950 group-hover:text-emerald-700 dark:text-neutral-50 dark:group-hover:text-emerald-300">
              {next.title}
            </p>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
