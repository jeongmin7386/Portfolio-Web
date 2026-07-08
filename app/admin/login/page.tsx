import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession, isAdminAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 로그인",
  description: "Studio Archive 관리자 로그인.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLoginPage() {
  const authEnabled = isAdminAuthEnabled();
  const session = await getAdminSession();

  if (authEnabled && session.authenticated) {
    redirect("/admin");
  }

  if (!authEnabled) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-xl content-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
          <h1 className="font-display text-3xl font-semibold">
            관리자 비밀번호가 필요합니다
          </h1>
          <p className="mt-3 text-sm leading-7">
            Render 환경변수에 STUDIO_ARCHIVE_ADMIN_PASSWORD를 설정하면 로그인
            보호가 켜집니다. 아직 설정하지 않았다면 관리 화면은 보호되지 않은
            상태로 열립니다.
          </p>
          <Link
            className="mt-5 inline-flex rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 transition hover:border-amber-400 dark:border-amber-800 dark:bg-neutral-950 dark:text-amber-100"
            href="/admin"
          >
            관리 화면으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[70vh] content-center px-4 py-12 sm:px-6 lg:px-8">
      <AdminLoginForm />
    </div>
  );
}
