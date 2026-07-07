import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProjectGrid } from "@/components/project-grid";
import { SectionTitle } from "@/components/section-title";
import { TagList } from "@/components/tag-list";
import { getFeaturedProjects, getRecentNotes } from "@/lib/content";

const capabilities = [
  "Brand Systems",
  "UI/UX",
  "Editorial",
  "Motion Direction",
  "Case Study Writing",
  "Design Ops"
];

export default async function HomePage() {
  const [featuredProjects, recentNotes] = await Promise.all([
    getFeaturedProjects(),
    getRecentNotes(3)
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 pb-16 pt-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Studio Archive
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-neutral-950 dark:text-neutral-50 md:text-7xl">
            A clean portfolio system for thoughtful visual work.
          </h1>
        </div>
        <div className="grid gap-6">
          <p className="text-base leading-8 text-neutral-600 dark:text-neutral-300">
            Independent designer focused on identities, digital products, and
            editorial systems. This archive combines flexible notes with
            polished case studies.
          </p>
          <TagList tags={capabilities} />
        </div>
      </section>

      <section className="pb-16">
        <SectionTitle
          action={
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50"
              href="/projects"
            >
              View all
              <ArrowUpRight aria-hidden size={16} />
            </Link>
          }
          description="A rotating edit of identity, product, editorial, and motion work."
          eyebrow="Featured"
          title="Representative Projects"
        />
        <ProjectGrid projects={featuredProjects.slice(0, 6)} />
      </section>

      <section className="pb-16">
        <SectionTitle
          action={
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50"
              href="/archive"
            >
              Open archive
              <ArrowUpRight aria-hidden size={16} />
            </Link>
          }
          eyebrow="Recent"
          title="Notes and Working Logs"
        />
        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {recentNotes.map((note) => (
            <article
              className="grid gap-3 py-5 md:grid-cols-[160px_1fr_auto] md:items-start"
              key={note.slug}
            >
              <time
                className="text-sm text-neutral-500 dark:text-neutral-500"
                dateTime={note.date}
              >
                {note.date}
              </time>
              <div>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                  {note.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  {note.excerpt}
                </p>
              </div>
              <TagList compact tags={note.tags.slice(0, 2)} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
