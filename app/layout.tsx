import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studio-archive.onrender.com"),
  title: {
    default: "Studio Archive",
    template: "%s | Studio Archive"
  },
  description: "이미지 중심 작업과 케이스 스터디, 과정 노트를 담은 미니멀 포트폴리오 아카이브.",
  keywords: [
    "포트폴리오",
    "디자인 포트폴리오",
    "케이스 스터디",
    "브랜딩",
    "UI UX",
    "에디토리얼 디자인"
  ],
  openGraph: {
    title: "Studio Archive",
    description: "이미지 중심 작업과 케이스 스터디, 과정 노트를 담은 미니멀 포트폴리오 아카이브.",
    siteName: "Studio Archive",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SiteHeader />
        <main className="page-transition min-h-screen">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
