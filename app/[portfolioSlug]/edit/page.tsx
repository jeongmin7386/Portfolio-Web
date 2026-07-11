import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminSession, getSessionEditPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 페이지 편집",
  description: "승인된 사용자 전용 Studio 낙화 편집 화면.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function UserEditPage() {
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect("/admin/login");
  }

  if (session.isOwner) {
    redirect("/admin");
  }

  const editBasePath = getSessionEditPath(session);
  redirect(editBasePath);
}
