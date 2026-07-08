import type { Metadata } from "next";

import { ProjectExplorer } from "@/components/project-explorer";
import { SectionTitle } from "@/components/section-title";
import { getAllProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "프로젝트",
  description: "브랜딩, UI/UX, 에디토리얼, 모션, 아트 디렉션 작업을 모은 프로젝트 아카이브."
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="pb-8 pt-8">
        <h1 className="font-display text-5xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-7xl">
          프로젝트
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 dark:text-neutral-300">
          선별한 작업을 그리드로 정리했습니다. 콘텐츠가 늘어나도 한눈에 훑을 수
          있도록 여백과 구조를 유지합니다.
        </p>
      </section>
      <section className="pb-16">
        <SectionTitle
          description="브랜드 시스템, 제품 인터페이스, 출판물, 모션, 이미지 디렉션을 함께 모았습니다."
          eyebrow="작업 목록"
          title="케이스 스터디"
        />
        <ProjectExplorer projects={projects} />
      </section>
    </div>
  );
}
