import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageBuilderEditor } from "@/components/page-builder-editor";
import { getAdminSession, isAdminAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "페이지 빌더",
  description: "Studio Archive 페이지 구조를 편집하는 빌더.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminEditorPage() {
  const authEnabled = isAdminAuthEnabled();
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  return <PageBuilderEditor authEnabled={authEnabled} />;
}
