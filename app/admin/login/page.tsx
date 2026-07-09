import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import {
  getAdminSession,
  isOwnerPasswordConfigured
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리자 로그인",
  description: "Studio Archive 관리자 로그인.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session.authenticated) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto grid min-h-[70vh] content-center px-4 py-12 sm:px-6 lg:px-8">
      <AdminLoginForm ownerPasswordConfigured={isOwnerPasswordConfigured()} />
    </div>
  );
}
