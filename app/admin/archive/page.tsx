import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageBuilderEditor } from "@/components/page-builder-editor";
import { getAdminSession, isAdminAuthEnabled } from "@/lib/auth";

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

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  return <PageBuilderEditor authEnabled={authEnabled} pageSlug="archive" />;
}
