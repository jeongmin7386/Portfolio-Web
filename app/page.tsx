import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ProjectGrid } from "@/components/project-grid";
import { SectionTitle } from "@/components/section-title";
import { TagList } from "@/components/tag-list";
import { getFeaturedProjects, getRecentNotes } from "@/lib/content";

const capabilities = [
  "브랜드 시스템",
  "UI/UX",
  "에디토리얼",
  "모션 디렉션",
  "케이스 스터디",
  "디자인 운영"
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
            작업의 맥락과 이미지를 차분하게 담는 포트폴리오.
          </h1>
        </div>
        <div className="grid gap-6">
          <p className="text-base leading-8 text-neutral-600 dark:text-neutral-300">
            브랜드, 디지털 제품, 에디토리얼 시스템을 다룹니다. 유연한 작업 노트와
            정제된 케이스 스터디를 한곳에 모았습니다.
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
              작업 보기
              <ArrowUpRight aria-hidden size={16} />
            </Link>
          }
          description="브랜딩, 제품, 편집, 모션 작업을 간결하게 묶었습니다."
          eyebrow="대표 작업"
          title="선별한 프로젝트"
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
              아카이브 보기
              <ArrowUpRight aria-hidden size={16} />
            </Link>
          }
          eyebrow="기록"
          title="최근 노트"
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
