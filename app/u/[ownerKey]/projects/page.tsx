import type { Metadata } from "next";

import { ProjectExplorer } from "@/components/project-explorer";
import { SectionTitle } from "@/components/section-title";
import {
  getAllCategories,
  getAllProjects,
  normalizeContentOwnerKey
} from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "프로젝트",
  description: "사용자 포트폴리오의 프로젝트 목록입니다."
};

type UserProjectsPageProps = {
  params: Promise<{
    ownerKey: string;
  }>;
};

export default async function UserProjectsPage({
  params
}: UserProjectsPageProps) {
  const { ownerKey: rawOwnerKey } = await params;
  const ownerKey = normalizeContentOwnerKey(rawOwnerKey);
  const [categories, projects] = await Promise.all([
    getAllCategories(ownerKey),
    getAllProjects(ownerKey)
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="pb-8 pt-8">
        <h1 className="font-display text-5xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-7xl">
          프로젝트
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 dark:text-neutral-300">
          이 포트폴리오에 등록된 작업을 모아 봅니다.
        </p>
      </section>
      <section className="pb-16">
        <SectionTitle
          description="카테고리별 프로젝트를 확인할 수 있습니다."
          eyebrow="작업 목록"
          title="케이스 스터디"
        />
        <ProjectExplorer
          categories={categories}
          projectBasePath={`/u/${ownerKey}/projects`}
          projects={projects}
        />
      </section>
    </div>
  );
}
