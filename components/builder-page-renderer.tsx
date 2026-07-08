"use client";

import Image from "next/image";
import Link from "next/link";

import { ProjectCard } from "@/components/project-card";
import { TagList } from "@/components/tag-list";
import type {
  BuilderBlock,
  BuilderPage,
  BuilderSection,
  Note,
  Project
} from "@/lib/types";

type BuilderPageRendererProps = {
  page: BuilderPage;
  projects: Project[];
  notes: Note[];
  editable?: boolean;
  selectedSectionId?: string;
  selectedBlockId?: string;
  onSelectSection?: (sectionId: string) => void;
  onSelectBlock?: (sectionId: string, blockId: string) => void;
};

const paddingYClass = {
  none: "py-0",
  sm: "py-6",
  md: "py-10",
  lg: "py-16",
  xl: "py-24"
};

const marginYClass = {
  none: "my-0",
  sm: "my-4",
  md: "my-8",
  lg: "my-12"
};

const maxWidthClass = {
  narrow: "max-w-3xl",
  content: "max-w-5xl",
  wide: "max-w-7xl",
  full: "max-w-none"
};

const gapClass = {
  none: "gap-0",
  sm: "gap-3",
  md: "gap-5",
  lg: "gap-8"
};

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right"
};

const radiusClass = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg"
};

const ratioClass = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[4/5]"
};

const columnsClass = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4"
};

const textWidthClass = {
  narrow: "max-w-2xl",
  content: "max-w-3xl",
  wide: "max-w-5xl"
};

function getSectionStyle(section: BuilderSection) {
  return {
    backgroundColor:
      section.settings.backgroundColor &&
      section.settings.backgroundColor !== "transparent"
        ? section.settings.backgroundColor
        : undefined,
    color: section.settings.textColor || undefined
  };
}

function getSectionFrameClass(section: BuilderSection, selected: boolean) {
  const padding = paddingYClass[section.settings.paddingY ?? "lg"];
  const margin = marginYClass[section.settings.marginY ?? "none"];
  const selection = selected
    ? "outline outline-2 outline-offset-[-2px] outline-emerald-500"
    : "";

  return `${padding} ${margin} ${selection}`;
}

function getInnerClass(section: BuilderSection) {
  const width = maxWidthClass[section.settings.maxWidth ?? "wide"];
  return `mx-auto w-full px-4 sm:px-6 lg:px-8 ${width}`;
}

function getBlockSelectionClass(selected: boolean) {
  return selected
    ? "outline outline-2 outline-offset-2 outline-blue-500"
    : "outline outline-0";
}

type BlockRendererProps = {
  block: BuilderBlock;
  editable?: boolean;
  selected?: boolean;
  sectionId: string;
  onSelectBlock?: (sectionId: string, blockId: string) => void;
};

function BuilderBlockRenderer({
  block,
  editable,
  selected,
  sectionId,
  onSelectBlock
}: BlockRendererProps) {
  const blockProps = {
    className: `${getBlockSelectionClass(Boolean(selected))} ${
      editable ? "cursor-pointer" : ""
    }`,
    onClick: editable
      ? (event: React.MouseEvent) => {
          event.stopPropagation();
          onSelectBlock?.(sectionId, block.id);
        }
      : undefined
  };

  switch (block.type) {
    case "heading": {
      const level = block.settings.level ?? 2;
      const className = `${blockProps.className} ${
        alignClass[block.settings.align ?? "left"]
      } ${
        level === 1
          ? "font-display text-5xl font-semibold leading-[1.04] tracking-normal text-neutral-950 dark:text-neutral-50 md:text-7xl"
          : level === 2
            ? "font-display text-3xl font-semibold tracking-normal text-neutral-950 dark:text-neutral-50 md:text-5xl"
            : "text-2xl font-semibold text-neutral-950 dark:text-neutral-50"
      }`;

      if (level === 1) {
        return (
          <h1 {...blockProps} className={className}>
            {block.content.text}
          </h1>
        );
      }

      if (level === 3) {
        return (
          <h3 {...blockProps} className={className}>
            {block.content.text}
          </h3>
        );
      }

      return (
        <h2 {...blockProps} className={className}>
          {block.content.text}
        </h2>
      );
    }
    case "paragraph":
      return (
        <p
          {...blockProps}
          className={`${blockProps.className} ${
            textWidthClass[block.settings.width ?? "content"]
          } whitespace-pre-line text-base leading-8 text-neutral-600 dark:text-neutral-300 ${
            alignClass[block.settings.align ?? "left"]
          } ${block.settings.align === "center" ? "mx-auto" : ""} ${
            block.settings.align === "right" ? "ml-auto" : ""
          }`}
        >
          {block.content.text}
        </p>
      );
    case "image":
      return (
        <figure {...blockProps} className={`${blockProps.className} grid gap-3`}>
          <div
            className={`overflow-hidden border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 ${
              ratioClass[block.settings.ratio ?? "wide"]
            } ${radiusClass[block.settings.borderRadius ?? "md"]}`}
          >
            <Image
              alt={block.content.alt}
              className="h-full w-full object-cover"
              height={900}
              sizes="100vw"
              src={block.content.src}
              unoptimized
              width={1400}
            />
          </div>
          {block.content.caption ? (
            <figcaption className="text-sm text-neutral-500 dark:text-neutral-400">
              {block.content.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    case "gallery":
      return (
        <div
          {...blockProps}
          className={`${blockProps.className} grid ${
            columnsClass[block.settings.columns ?? 3]
          } ${gapClass[block.settings.gap ?? "md"]}`}
        >
          {block.content.images.map((image) => (
            <figure className="grid gap-2" key={`${block.id}-${image.src}`}>
              <div className="aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                <Image
                  alt={image.alt}
                  className="h-full w-full object-cover"
                  height={800}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  src={image.src}
                  unoptimized
                  width={800}
                />
              </div>
              {image.caption ? (
                <figcaption className="text-sm text-neutral-500">
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      );
    case "button": {
      const variant = block.settings.variant ?? "primary";
      const buttonClass =
        variant === "primary"
          ? "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
          : variant === "secondary"
            ? "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            : "border-transparent bg-transparent px-0 text-neutral-950 underline-offset-4 hover:underline dark:text-neutral-50";

      return (
        <div
          {...blockProps}
          className={`${blockProps.className} flex ${
            block.settings.align === "center"
              ? "justify-center"
              : block.settings.align === "right"
                ? "justify-end"
                : "justify-start"
          }`}
        >
          <Link
            className={`inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
            href={block.content.href}
          >
            {block.content.label}
          </Link>
        </div>
      );
    }
    case "divider":
      return (
        <div
          {...blockProps}
          className={`${blockProps.className} ${
            block.settings.spacing === "lg"
              ? "py-10"
              : block.settings.spacing === "sm"
                ? "py-3"
                : "py-6"
          }`}
        >
          {block.settings.style === "blank" ? null : (
            <div
              className={`border-t border-neutral-200 dark:border-neutral-800 ${
                block.settings.style === "dashed" ? "border-dashed" : ""
              }`}
            />
          )}
        </div>
      );
    case "embed":
      return (
        <div
          {...blockProps}
          className={`${blockProps.className} overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 ${
            block.settings.ratio === "square" ? "aspect-square" : "aspect-video"
          }`}
        >
          <iframe
            className="h-full w-full"
            src={block.content.url}
            title={block.content.provider || "임베드 콘텐츠"}
          />
        </div>
      );
    case "spacer":
      return (
        <div
          {...blockProps}
          className={blockProps.className}
          style={{ height: block.settings.height ?? 48 }}
        />
      );
    case "quote":
      return (
        <blockquote
          {...blockProps}
          className={`${blockProps.className} max-w-4xl border-l-2 border-emerald-600 pl-6 text-2xl leading-10 text-neutral-900 dark:border-emerald-400 dark:text-neutral-100 ${
            block.settings.align === "center" ? "mx-auto text-center" : ""
          } ${block.settings.align === "right" ? "ml-auto text-right" : ""}`}
        >
          <p>{block.content.text}</p>
          {block.content.author ? (
            <cite className="mt-4 block text-sm not-italic text-neutral-500">
              {block.content.author}
            </cite>
          ) : null}
        </blockquote>
      );
    case "stats":
      return (
        <div
          {...blockProps}
          className={`${blockProps.className} rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 ${
            alignClass[block.settings.align ?? "left"]
          }`}
        >
          <p className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
            {block.content.value}
          </p>
          <p className="mt-2 text-sm text-neutral-500">{block.content.label}</p>
        </div>
      );
  }
}

function renderProjectList(section: BuilderSection, projects: Project[]) {
  const sourceProjects =
    section.settings.projectSource === "all"
      ? projects
      : projects.filter((project) => project.featured);
  const filteredProjects = section.settings.category
    ? sourceProjects.filter(
        (project) => project.category === section.settings.category
      )
    : sourceProjects;
  const visibleProjects = filteredProjects.slice(
    0,
    section.settings.projectLimit ?? 6
  );

  if (section.settings.gridStyle === "list") {
    return (
      <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {visibleProjects.map((project) => (
          <Link
            className="grid gap-4 py-5 transition hover:text-emerald-700 dark:hover:text-emerald-300 md:grid-cols-[1fr_160px_120px]"
            href={`/projects/${project.slug}`}
            key={project.slug}
          >
            <div>
              <h3 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
                {project.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {project.description}
              </p>
            </div>
            <span className="text-sm text-neutral-500">{project.category}</span>
            <span className="text-sm text-neutral-500">{project.year}</span>
          </Link>
        ))}
      </div>
    );
  }

  const gridStyle =
    section.settings.gridStyle === "masonry"
      ? "columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5"
      : `grid ${columnsClass[section.settings.columns ?? 3]} ${
          gapClass[section.settings.gap ?? "md"]
        }`;

  return (
    <div className={gridStyle}>
      {visibleProjects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}

function renderArchiveList(notes: Note[]) {
  return (
    <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {notes.slice(0, 4).map((note) => (
        <article
          className="grid gap-3 py-5 md:grid-cols-[160px_1fr_auto] md:items-start"
          key={note.slug}
        >
          <time
            className="text-sm text-neutral-500 dark:text-neutral-500"
            dateTime={note.date}
          >
            {note.date}
          </time>
          <div>
            <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              {note.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {note.excerpt}
            </p>
          </div>
          <TagList compact tags={note.tags.slice(0, 2)} />
        </article>
      ))}
    </div>
  );
}

type SectionRendererProps = BuilderPageRendererProps & {
  section: BuilderSection;
};

function SectionRenderer({
  section,
  projects,
  notes,
  editable,
  selectedSectionId,
  selectedBlockId,
  onSelectSection,
  onSelectBlock
}: SectionRendererProps) {
  const selected = selectedSectionId === section.id;
  const blocks = [...section.blocks].sort((a, b) => a.order - b.order);
  const gap = gapClass[section.settings.gap ?? "md"];
  const sectionProps = {
    className: getSectionFrameClass(section, selected),
    style: getSectionStyle(section),
    onClick: editable
      ? () => {
          onSelectSection?.(section.id);
        }
      : undefined
  };

  const blockList = (
    <div className={`grid ${gap}`}>
      {blocks.map((block) => (
        <BuilderBlockRenderer
          block={block}
          editable={editable}
          key={block.id}
          onSelectBlock={onSelectBlock}
          sectionId={section.id}
          selected={selectedBlockId === block.id}
        />
      ))}
    </div>
  );

  return (
    <section {...sectionProps}>
      <div className={getInnerClass(section)}>
        {section.type === "twoColumn" ? (
          <div className={`grid ${gap} md:grid-cols-2`}>{blockList}</div>
        ) : (
          blockList
        )}
        {section.type === "projectGrid" ? (
          <div className="mt-8">{renderProjectList(section, projects)}</div>
        ) : null}
        {section.type === "archiveList" ? (
          <div className="mt-8">{renderArchiveList(notes)}</div>
        ) : null}
      </div>
    </section>
  );
}

export function BuilderPageRenderer({
  page,
  projects,
  notes,
  editable,
  selectedSectionId,
  selectedBlockId,
  onSelectSection,
  onSelectBlock
}: BuilderPageRendererProps) {
  return (
    <div className={editable ? "bg-white dark:bg-neutral-950" : ""}>
      {page.sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <SectionRenderer
            editable={editable}
            key={section.id}
            notes={notes}
            onSelectBlock={onSelectBlock}
            onSelectSection={onSelectSection}
            page={page}
            projects={projects}
            section={section}
            selectedBlockId={selectedBlockId}
            selectedSectionId={selectedSectionId}
          />
        ))}
    </div>
  );
}
