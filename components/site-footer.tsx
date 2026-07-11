"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const userMatch = pathname.match(/^\/u\/([^/]+)/);
  const userBasePath = userMatch ? `/u/${userMatch[1]}` : "";
  const portfolioMatch = pathname.match(/^\/([^/]+-portfoilo)(?:\/|$)/);
  const portfolioBasePath = portfolioMatch ? `/${portfolioMatch[1]}` : "";
  const publicBasePath = userBasePath || portfolioBasePath;
  const footerLinks = publicBasePath
    ? [
        { href: `${publicBasePath}/projects`, label: "프로젝트" },
        { href: `${publicBasePath}/archive`, label: "아카이브" }
      ]
    : [
        { href: "/", label: "시작하기" },
        { href: "/admin/login", label: "로그인" }
      ];

  return (
    <footer className="border-t border-neutral-200 bg-white/60 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-neutral-600 dark:text-neutral-400 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-display text-base font-semibold text-neutral-950 dark:text-neutral-50">
            Studio 낙화
          </p>
          <p className="mt-2 max-w-xl leading-6">
            포트폴리오를 만들고, 편집하고, 각자의 공개 페이지로 발행하는
            작업 공간입니다.
          </p>
        </div>
        <nav
          aria-label="하단 메뉴"
          className="flex flex-wrap items-start gap-x-5 gap-y-2 md:justify-end"
        >
          {footerLinks.map((link) => (
            <Link
              className="transition hover:text-neutral-950 dark:hover:text-neutral-50"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
