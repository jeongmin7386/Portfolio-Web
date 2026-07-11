import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminEditor } from "@/components/admin-editor";
import {
  getAdminSession,
  getSessionEditPath,
  isSessionEditSlug,
  isAdminAuthEnabled
} from "@/lib/auth";
import { getContentStorageMode } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 프로젝트 편집",
  description: "승인된 사용자 전용 Studio 낙화 프로젝트 편집 화면.",
  robots: {
    index: false,
    follow: false
  }
};

type UserProjectsEditPageProps = {
  params: Promise<{
    portfolioSlug: string;
  }>;
};

export default async function UserProjectsEditPage({
  params
}: UserProjectsEditPageProps) {
  const authEnabled = isAdminAuthEnabled();
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  if (session.isOwner) {
    redirect("/admin/projects");
  }

  const { portfolioSlug } = await params;
  const editBasePath = getSessionEditPath(session);
  const expectedPath = getSessionEditPath(session, "projects");

  if (!isSessionEditSlug(session, portfolioSlug)) {
    redirect(expectedPath);
  }

  return (
    <div className="min-h-[var(--app-viewport-height)] overflow-x-hidden bg-neutral-100 px-3 py-4 dark:bg-neutral-950 sm:px-4 lg:px-6">
      <AdminEditor
        authEnabled={authEnabled}
        canManageAccounts={false}
        editBasePath={editBasePath}
        mode="projects"
        storageMode={getContentStorageMode()}
      />
    </div>
  );
}
