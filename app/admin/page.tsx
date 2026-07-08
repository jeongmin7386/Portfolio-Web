import type { Metadata } from "next";

import { AdminEditor } from "@/components/admin-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관리",
  description: "Studio Archive 콘텐츠를 편집하는 관리 화면.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminEditor />
    </div>
  );
}
