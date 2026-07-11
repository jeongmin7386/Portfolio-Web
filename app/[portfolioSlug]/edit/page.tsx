import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageBuilderEditor } from "@/components/page-builder-editor";
import {
  getAdminSession,
  getSessionEditPath,
  isSessionEditSlug,
  isAdminAuthEnabled
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 페이지 편집",
  description: "승인된 사용자 전용 Studio 낙화 편집 화면.",
  robots: {
    index: false,
    follow: false
  }
};

type UserEditPageProps = {
  params: Promise<{
    portfolioSlug: string;
  }>;
};

export default async function UserEditPage({ params }: UserEditPageProps) {
  const authEnabled = isAdminAuthEnabled();
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  if (session.isOwner) {
    redirect("/admin");
  }

  const { portfolioSlug } = await params;
  const editBasePath = getSessionEditPath(session);

  if (!isSessionEditSlug(session, portfolioSlug)) {
    redirect(editBasePath);
  }

  return (
    <PageBuilderEditor
      authEnabled={authEnabled}
      canManageAccounts={false}
      editBasePath={editBasePath}
    />
  );
}
