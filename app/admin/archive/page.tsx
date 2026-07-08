import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminEditor } from "@/components/admin-editor";
import { getAdminSession, isAdminAuthEnabled } from "@/lib/auth";
import { getContentStorageMode } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "아카이브 편집",
  description: "Studio Archive 아카이브 노트를 편집하는 관리 화면.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminArchivePage() {
  const authEnabled = isAdminAuthEnabled();
  const session = await getAdminSession();

  if (authEnabled && !session.authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminEditor
        authEnabled={authEnabled}
        mode="notes"
        storageMode={getContentStorageMode()}
      />
    </div>
  );
}
