import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-20 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          404
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-6xl">
          This page is not in the archive.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
          The project or note may have moved, or the URL may need another look.
        </p>
        <Link
          className="mt-8 inline-flex rounded-md bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
          href="/projects"
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}
