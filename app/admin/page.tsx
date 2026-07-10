import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminEditor } from "@/components/admin-editor";
import { getAdminSession, isAdminAuthEnabled } from "@/lib/auth";
import { getContentStorageMode } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리",
  description: "Studio Archive 콘텐츠를 편집하는 관리 화면.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminPage() {
  const authEnabled = isAdminAuthEnabled();
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-[var(--app-viewport-height)] overflow-x-hidden bg-neutral-100 px-3 py-4 dark:bg-neutral-950 sm:px-4 lg:px-6">
      <AdminEditor
        authEnabled={authEnabled}
        storageMode={getContentStorageMode()}
      />
    </div>
  );
}
