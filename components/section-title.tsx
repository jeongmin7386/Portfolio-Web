import type { ReactNode } from "react";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  action
}: SectionTitleProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
