import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import { SectionTitle } from "@/components/section-title";
import { TagList } from "@/components/tag-list";

export const metadata: Metadata = {
  title: "소개",
  description: "Studio Archive의 작업 방향, 이력, 사용 도구와 연락처."
};

const career = [
  {
    period: "2024 - 현재",
    title: "독립 디자이너",
    description:
      "문화와 기술 분야의 팀을 위해 아이덴티티, 제품 인터페이스, 에디토리얼 케이스 스터디를 만듭니다."
  },
  {
    period: "2021 - 2024",
    title: "시니어 비주얼 디자이너",
    description:
      "브랜드 리뉴얼, 디자인 시스템, 디지털 캠페인 아트 디렉션을 이끌었습니다."
  },
  {
    period: "2018 - 2021",
    title: "에디토리얼 디자이너",
    description:
      "출판물, 이미지 시스템, 전시 그래픽을 중심으로 작업했습니다."
  }
];

const tools = [
  "Figma",
  "Framer",
  "Illustrator",
  "Photoshop",
  "InDesign",
  "After Effects",
  "Notion",
  "Webflow"
];

const socialLinks = [
  { label: "메일", href: "mailto:hello@studioarchive.example" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Behance", href: "https://behance.net" },
  { label: "LinkedIn", href: "https://linkedin.com" }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 pb-16 pt-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            소개
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-7xl">
            차분한 구조로 작업을 정리합니다.
          </h1>
        </div>
        <div className="grid gap-6 text-base leading-8 text-neutral-600 dark:text-neutral-300">
          <p>
            Studio Archive는 시각 작업을 개인 지식 베이스처럼 유연하게 정리하는
            포트폴리오입니다. 케이스 스터디와 리서치 조각, 런칭 노트, 이미지 시스템을
            함께 담습니다.
          </p>
          <p>
            브랜드 아이덴티티, UI/UX, 에디토리얼 디렉션, 모션 기반 스토리텔링을
            오가며 작업합니다.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <SectionTitle eyebrow="경험" title="이력" />
        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {career.map((item) => (
            <article
              className="grid gap-4 py-6 md:grid-cols-[180px_1fr]"
              key={item.title}
            >
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                {item.period}
              </p>
              <div>
                <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
                  {item.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-12 pb-16 md:grid-cols-2">
        <div>
          <SectionTitle eyebrow="도구" title="작업 도구" />
          <TagList tags={tools} />
        </div>
        <div>
          <SectionTitle eyebrow="연락" title="링크" />
          <div className="grid gap-3">
            {socialLinks.map((link) => (
              <a
                className="inline-flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50"
                href={link.href}
                key={link.label}
              >
                {link.label}
                <ArrowUpRight aria-hidden size={16} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
