"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";

const serviceNavItems = [
  { href: "/", label: "시작" },
  { href: "/admin/login", label: "로그인" }
];

const adminNavItems = [
  { href: "/admin", label: "관리" },
  { href: "/admin/editor", label: "홈 편집" },
  { href: "/admin/projects", label: "프로젝트" },
  { href: "/admin/archive", label: "아카이브" },
  { href: "/admin/accounts", label: "계정 승인" }
];

const portfolioNavItems = [
  { href: "/", label: "홈" },
  { href: "/projects", label: "프로젝트" },
  { href: "/archive", label: "아카이브" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const userMatch = pathname.match(/^\/u\/([^/]+)/);
  const userBasePath = userMatch ? `/u/${userMatch[1]}` : "";
  const portfolioMatch = pathname.match(/^\/([^/]+-portfoilo)(?:\/|$)/);
  const portfolioBasePath = portfolioMatch ? `/${portfolioMatch[1]}` : "";
  const publicBasePath = userBasePath || portfolioBasePath;
  const isAdminPath = pathname.startsWith("/admin");

  const visibleNavItems = publicBasePath
    ? portfolioNavItems.map((item) => ({
        ...item,
        href: item.href === "/" ? publicBasePath : `${publicBasePath}${item.href}`
      }))
    : isAdminPath
      ? adminNavItems
      : serviceNavItems;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-stone-50/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          className="rounded-md font-display text-sm font-semibold uppercase tracking-[0.16em] text-neutral-950 outline-none transition hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:text-neutral-50 dark:hover:text-emerald-300"
          href={publicBasePath || "/"}
        >
          Studio Archive
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <nav
            aria-label="주요 메뉴"
            className="flex min-w-0 items-center gap-1 overflow-x-auto"
          >
            {visibleNavItems.map((item) => {
              const active =
                publicBasePath && item.href === publicBasePath
                  ? pathname === publicBasePath
                  : item.href === "/admin"
                    ? pathname === "/admin"
                  : item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-md px-2.5 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:px-3 ${
                    active
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
