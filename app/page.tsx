import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import {
  getAdminSession,
  getSessionEditPath,
  isOwnerPasswordConfigured
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio 낙화 시작하기",
  description:
    "승인받은 계정으로 로그인하거나 새 계정을 요청해 나만의 포트폴리오를 편집합니다.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function HomePage() {
  const session = await getAdminSession();

  if (session.authenticated) {
    redirect(getSessionEditPath(session));
  }

  return (
    <div className="min-h-[var(--app-viewport-height)] bg-neutral-50 px-4 py-10 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <section className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            Studio 낙화
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            나만의 포트폴리오를 만들고 편집하는 공간
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600 dark:text-neutral-300">
            승인받은 계정으로 로그인하면 각자 독립된 작업 공간이 열립니다.
            홈, 프로젝트, 아카이브를 직접 편집하고 공개 페이지로 발행할 수
            있습니다.
          </p>
          <div className="mt-8 grid gap-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300 sm:grid-cols-3">
            <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <strong className="block text-neutral-950 dark:text-neutral-50">
                계정 요청
              </strong>
              <span className="mt-2 block">
                새 사용자는 요청을 보내고 승인 후 사용할 수 있습니다.
              </span>
            </div>
            <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <strong className="block text-neutral-950 dark:text-neutral-50">
                개인 작업 공간
              </strong>
              <span className="mt-2 block">
                사용자마다 콘텐츠와 페이지가 따로 저장됩니다.
              </span>
            </div>
            <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <strong className="block text-neutral-950 dark:text-neutral-50">
                실시간 편집
              </strong>
              <span className="mt-2 block">
                편집 화면에서 바로 확인하고 저장, 발행할 수 있습니다.
              </span>
            </div>
          </div>
        </section>

        <AdminLoginForm ownerPasswordConfigured={isOwnerPasswordConfigured()} />
      </div>
    </div>
  );
}
