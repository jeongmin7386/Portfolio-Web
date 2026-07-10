import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccountsManager } from "@/components/admin-accounts-manager";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 승인",
  description: "Studio Archive 관리자 계정 신청을 승인하는 화면.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminAccountsPage() {
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  if (!session.isOwner) {
    return (
      <div className="min-h-[var(--app-viewport-height)] bg-neutral-100 px-3 py-4 dark:bg-neutral-950 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-xl rounded-md border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
          <h1 className="font-display text-3xl font-semibold">
            소유자 권한이 필요합니다
          </h1>
          <p className="mt-3 text-sm leading-7">
            관리자 계정 승인은 사이트 소유자만 처리할 수 있습니다. 소유자
            비밀번호로 다시 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--app-viewport-height)] overflow-x-hidden bg-neutral-100 px-3 py-4 dark:bg-neutral-950 sm:px-4 lg:px-6">
      <AdminAccountsManager />
    </div>
  );
}
