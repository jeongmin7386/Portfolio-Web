import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studio-archive.example.com"),
  title: {
    default: "Studio Archive",
    template: "%s | Studio Archive"
  },
  description:
    "A minimalist portfolio archive for case studies, image-led projects, and process notes.",
  keywords: [
    "portfolio",
    "design portfolio",
    "case study",
    "branding",
    "UI UX",
    "editorial design"
  ],
  openGraph: {
    title: "Studio Archive",
    description:
      "A minimalist portfolio archive for case studies, image-led projects, and process notes.",
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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SiteHeader />
        <main className="page-transition min-h-screen">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
