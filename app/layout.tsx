import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studio-archive.onrender.com"),
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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SiteHeader />
        <main className="page-transition min-h-[var(--app-viewport-height)]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
