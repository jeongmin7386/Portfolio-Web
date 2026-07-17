import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAdminSession } from "@/lib/auth";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://studiofflower.dev"),
  title: {
    default: "Studio 낙화",
    template: "%s | Studio 낙화"
  },
  description:
    "로그인 후 나만의 포트폴리오를 만들고 편집하는 Studio 낙화 작업 공간입니다.",
  keywords: [
    "포트폴리오 빌더",
    "포트폴리오 편집",
    "디자이너 포트폴리오",
    "프로젝트 아카이브",
    "Studio 낙화"
  ],
  openGraph: {
    title: "Studio 낙화",
    description:
      "로그인 후 나만의 포트폴리오를 만들고 편집하는 Studio 낙화 작업 공간입니다.",
    siteName: "Studio 낙화",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SiteHeader authenticated={session.authenticated} />
        <main className="page-transition min-h-[var(--app-viewport-height)]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
