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
  description:
    "로그인 후 나만의 포트폴리오를 만들고 편집하는 Studio Archive 작업 공간입니다.",
  keywords: [
    "포트폴리오 빌더",
    "포트폴리오 편집",
    "디자이너 포트폴리오",
    "프로젝트 아카이브",
    "Studio Archive"
  ],
  openGraph: {
    title: "Studio Archive",
    description:
      "로그인 후 나만의 포트폴리오를 만들고 편집하는 Studio Archive 작업 공간입니다.",
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
