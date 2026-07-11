import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageBuilderEditor } from "@/components/page-builder-editor";
import {
  getAdminSession,
  getSessionEditPath,
  isAdminAuthEnabled
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 아카이브 편집",
  description: "승인된 사용자 전용 Studio 낙화 아카이브 편집 화면.",
  robots: {
    index: false,
    follow: false
  }
};

type UserArchiveEditPageProps = {
  params: Promise<{
    portfolioSlug: string;
  }>;
};

export default async function UserArchiveEditPage({
  params
}: UserArchiveEditPageProps) {
  const authEnabled = isAdminAuthEnabled();
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  if (session.isOwner) {
    redirect("/admin/archive");
  }

  const { portfolioSlug } = await params;
  const editBasePath = getSessionEditPath(session);
  const expectedPath = getSessionEditPath(session, "archive");
  const currentPath = `/${portfolioSlug}/edit/archive`;

  if (currentPath !== expectedPath) {
    redirect(expectedPath);
  }

  return (
    <PageBuilderEditor
      authEnabled={authEnabled}
      canManageAccounts={false}
      editBasePath={editBasePath}
      pageSlug="archive"
    />
  );
}
