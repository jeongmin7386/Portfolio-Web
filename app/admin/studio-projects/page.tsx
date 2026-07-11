import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StudioProjectsManager } from "@/components/studio-projects-manager";
import {
  getAdminSession,
  getSessionEditPath,
  isAdminAuthEnabled
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 프로젝트",
  description: "Studio 낙화 프로젝트를 저장하고 불러오는 화면.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminStudioProjectsPage() {
  const session = await getAdminSession();

  if (!isAdminAuthEnabled() || !session.authenticated) {
    redirect("/admin/login");
  }

  if (!session.isOwner) {
    redirect(`${getSessionEditPath(session)}/studio-projects`);
  }

  return (
    <div className="min-h-[var(--app-viewport-height)] bg-neutral-100 dark:bg-neutral-950">
      <StudioProjectsManager editBasePath="/admin" />
    </div>
  );
}
