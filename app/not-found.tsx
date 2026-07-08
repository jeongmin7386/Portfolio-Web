import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-20 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          404
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-6xl">
          아카이브에 없는 페이지입니다.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
          프로젝트나 노트가 이동했거나, 주소가 올바르지 않을 수 있습니다.
        </p>
        <Link
          className="mt-8 inline-flex rounded-md bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
          href="/projects"
        >
          프로젝트로 돌아가기
        </Link>
      </div>
    </div>
  );
}
