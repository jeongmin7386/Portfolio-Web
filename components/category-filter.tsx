"use client";

import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/types";

export type CategorySelection = ProjectCategory | "All";

const filterOptions: CategorySelection[] = ["All", ...PROJECT_CATEGORIES];

type CategoryFilterProps = {
  selected: CategorySelection;
  onChange: (category: CategorySelection) => void;
  counts?: Partial<Record<CategorySelection, number>>;
};

export function CategoryFilter({
  selected,
  onChange,
  counts
}: CategoryFilterProps) {
  return (
    <div
      aria-label="Project categories"
      className="mb-10 flex flex-wrap gap-2"
      role="toolbar"
    >
      {filterOptions.map((option) => {
        const active = selected === option;

        return (
          <button
            aria-pressed={active}
            className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
              active
                ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-50"
            }`}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            <span>{option}</span>
            {typeof counts?.[option] === "number" ? (
              <span
                className={`rounded-sm px-1.5 py-0.5 text-[11px] ${
                  active
                    ? "bg-white/15 text-current dark:bg-neutral-950/10"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500"
                }`}
              >
                {counts[option]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
