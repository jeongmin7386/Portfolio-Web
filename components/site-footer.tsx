import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white/60 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-neutral-600 dark:text-neutral-400 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-display text-base font-semibold text-neutral-950 dark:text-neutral-50">
            Studio Archive
          </p>
          <p className="mt-2 max-w-xl leading-6">
            A modular portfolio system for image-led work, case studies, and
            process notes.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-start gap-x-5 gap-y-2 md:justify-end"
        >
          <Link className="transition hover:text-neutral-950 dark:hover:text-neutral-50" href="/projects">
            Projects
          </Link>
          <Link className="transition hover:text-neutral-950 dark:hover:text-neutral-50" href="/archive">
            Archive
          </Link>
          <Link className="transition hover:text-neutral-950 dark:hover:text-neutral-50" href="/about">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
