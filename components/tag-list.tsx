type TagListProps = {
  tags: string[];
  className?: string;
  compact?: boolean;
};

export function TagList({ tags, className = "", compact = false }: TagListProps) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <li
          className={`rounded-md border border-neutral-200 bg-white/70 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-300 ${
            compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
          }`}
          key={tag}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
