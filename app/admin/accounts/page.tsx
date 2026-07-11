import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminAccountsManager } from "@/components/admin-accounts-manager";
import { getAdminSession, getSessionEditPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 승인",
  description: "Studio 낙화 관리자 계정 신청을 승인하는 화면.",
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
    redirect(getSessionEditPath(session));
  }

  return (
    <div className="min-h-[var(--app-viewport-height)] overflow-x-hidden bg-neutral-100 px-3 py-4 dark:bg-neutral-950 sm:px-4 lg:px-6">
      <AdminAccountsManager />
    </div>
  );
}
