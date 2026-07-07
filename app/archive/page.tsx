import type { Metadata } from "next";

import { SectionTitle } from "@/components/section-title";
import { TagList } from "@/components/tag-list";
import { getAllNotes } from "@/lib/content";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "A lightweight notes archive for research, process logs, references, and working ideas."
};

export default async function ArchivePage() {
  const notes = await getAllNotes();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="pb-10 pt-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Archive
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-7xl">
          Notes, references, and process traces.
        </h1>
      </section>

      <section className="pb-16">
        <SectionTitle
          description="Research notes, process fragments, reference lists, and small observations from ongoing work."
          eyebrow="Notes"
          title="Working Archive"
        />
        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {notes.map((note) => (
            <article
              className="grid gap-4 py-6 md:grid-cols-[160px_1fr_180px]"
              key={note.slug}
            >
              <div className="grid gap-1">
                <time
                  className="text-sm text-neutral-500 dark:text-neutral-500"
                  dateTime={note.date}
                >
                  {note.date}
                </time>
                <span className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                  {note.category}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
                  {note.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                  {note.excerpt}
                </p>
              </div>
              <TagList compact tags={note.tags} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
