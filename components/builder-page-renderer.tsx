"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type FocusEvent,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  useEffect,
  useRef
} from "react";

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
  onChangeBlock?: (sectionId: string, block: BuilderBlock) => void;
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
  onChangeBlock?: (sectionId: string, block: BuilderBlock) => void;
};

type InlineEditableTag = "cite" | "figcaption" | "h1" | "h2" | "h3" | "p" | "span";

type InlineEditableTextProps = {
  as: InlineEditableTag;
  value: string;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
};

function InlineEditableText({
  as,
  value,
  className,
  multiline,
  placeholder,
  onChange,
  onFocus
}: InlineEditableTextProps) {
  const elementRef = useRef<HTMLElement | null>(null);
  const editableClassName = `${className ?? ""} min-h-[1em] rounded-sm outline-none transition empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)] focus-visible:ring-2 focus-visible:ring-emerald-500/30`;

  useEffect(() => {
    const element = elementRef.current;

    if (!element || document.activeElement === element) {
      return;
    }

    if (element.textContent !== value) {
      element.textContent = value;
    }
  }, [value]);

  const editableProps: HTMLAttributes<HTMLElement> & {
    "data-placeholder": string;
  } = {
    "aria-label": placeholder,
    "aria-multiline": multiline || undefined,
    className: editableClassName,
    contentEditable: true,
    "data-placeholder": placeholder ?? "",
    dir: "ltr",
    onBlur: (event: FocusEvent<HTMLElement>) => {
      const nextValue = event.currentTarget.textContent ?? "";

      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    onFocus,
    onInput: (event: FormEvent<HTMLElement>) =>
      onChange(event.currentTarget.textContent ?? ""),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (!multiline && event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    role: "textbox",
    suppressContentEditableWarning: true
  };

  const setElementRef = (element: HTMLElement | null) => {
    elementRef.current = element;
  };

  switch (as) {
    case "cite":
      return <cite {...editableProps} ref={setElementRef} />;
    case "figcaption":
      return <figcaption {...editableProps} ref={setElementRef} />;
    case "h1":
      return <h1 {...editableProps} ref={setElementRef} />;
    case "h2":
      return <h2 {...editableProps} ref={setElementRef} />;
    case "h3":
      return <h3 {...editableProps} ref={setElementRef} />;
    case "p":
      return <p {...editableProps} ref={setElementRef} />;
    case "span":
      return <span {...editableProps} ref={setElementRef} />;
  }
}

type FloatingBlockToolbarProps = {
  block: BuilderBlock;
  onChange: (block: BuilderBlock) => void;
};

function ToolbarButton({
  active,
  children,
  onClick
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-xs font-medium transition ${
        active
          ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarSelect({
  label,
  value,
  children,
  onChange
}: {
  label: string;
  value: string | number;
  children: React.ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-neutral-500">
      {label}
      <select
        className="h-8 rounded-sm border border-neutral-200 bg-white px-2 text-xs text-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function AlignControls({
  value,
  onChange
}: {
  value: "left" | "center" | "right";
  onChange: (value: "left" | "center" | "right") => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {(["left", "center", "right"] as const).map((align) => (
        <ToolbarButton
          active={value === align}
          key={align}
          onClick={() => onChange(align)}
        >
          {align === "left" ? "좌" : align === "center" ? "중" : "우"}
        </ToolbarButton>
      ))}
    </div>
  );
}

function FloatingBlockToolbar({ block, onChange }: FloatingBlockToolbarProps) {
  const frameClass =
    "absolute left-0 top-0 z-40 flex -translate-y-[calc(100%+8px)] flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95";

  const updateSettings = (settings: BuilderBlock["settings"]) => {
    onChange({
      ...block,
      settings: {
        ...block.settings,
        ...settings
      } as BuilderBlock["settings"]
    } as BuilderBlock);
  };

  return (
    <div
      className={frameClass}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {block.type === "heading" ? (
        <>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((level) => (
              <ToolbarButton
                active={(block.settings.level ?? 2) === level}
                key={level}
                onClick={() =>
                  onChange({
                    ...block,
                    settings: {
                      ...block.settings,
                      level: level as 1 | 2 | 3
                    }
                  })
                }
              >
                H{level}
              </ToolbarButton>
            ))}
          </div>
          <AlignControls
            onChange={(align) => updateSettings({ align })}
            value={block.settings.align ?? "left"}
          />
        </>
      ) : null}

      {block.type === "paragraph" ? (
        <>
          <ToolbarSelect
            label="너비"
            onChange={(width) =>
              updateSettings({
                width: width as "narrow" | "content" | "wide"
              })
            }
            value={block.settings.width ?? "content"}
          >
            <option value="narrow">좁게</option>
            <option value="content">기본</option>
            <option value="wide">넓게</option>
          </ToolbarSelect>
          <AlignControls
            onChange={(align) => updateSettings({ align })}
            value={block.settings.align ?? "left"}
          />
        </>
      ) : null}

      {block.type === "button" ? (
        <>
          <ToolbarSelect
            label="형태"
            onChange={(variant) =>
              updateSettings({
                variant: variant as "primary" | "secondary" | "text"
              })
            }
            value={block.settings.variant ?? "primary"}
          >
            <option value="primary">채움</option>
            <option value="secondary">선</option>
            <option value="text">텍스트</option>
          </ToolbarSelect>
          <AlignControls
            onChange={(align) => updateSettings({ align })}
            value={block.settings.align ?? "left"}
          />
        </>
      ) : null}

      {block.type === "quote" || block.type === "stats" ? (
        <AlignControls
          onChange={(align) => updateSettings({ align })}
          value={block.settings.align ?? "left"}
        />
      ) : null}

      {block.type === "image" ? (
        <>
          <ToolbarSelect
            label="비율"
            onChange={(ratio) =>
              updateSettings({ ratio: ratio as "wide" | "square" | "portrait" })
            }
            value={block.settings.ratio ?? "wide"}
          >
            <option value="wide">가로</option>
            <option value="square">정사각</option>
            <option value="portrait">세로</option>
          </ToolbarSelect>
          <ToolbarSelect
            label="모서리"
            onChange={(borderRadius) =>
              updateSettings({
                borderRadius: borderRadius as "none" | "sm" | "md" | "lg"
              })
            }
            value={block.settings.borderRadius ?? "md"}
          >
            <option value="none">없음</option>
            <option value="sm">작게</option>
            <option value="md">보통</option>
            <option value="lg">크게</option>
          </ToolbarSelect>
        </>
      ) : null}

      {block.type === "gallery" ? (
        <ToolbarSelect
          label="열"
          onChange={(columns) =>
            updateSettings({ columns: Number(columns) as 2 | 3 | 4 })
          }
          value={block.settings.columns ?? 3}
        >
          <option value={2}>2열</option>
          <option value={3}>3열</option>
          <option value={4}>4열</option>
        </ToolbarSelect>
      ) : null}

      {block.type === "divider" ? (
        <>
          <ToolbarSelect
            label="형태"
            onChange={(style) =>
              updateSettings({ style: style as "line" | "dashed" | "blank" })
            }
            value={block.settings.style ?? "line"}
          >
            <option value="line">실선</option>
            <option value="dashed">점선</option>
            <option value="blank">여백</option>
          </ToolbarSelect>
          <ToolbarSelect
            label="간격"
            onChange={(spacing) =>
              updateSettings({ spacing: spacing as "sm" | "md" | "lg" })
            }
            value={block.settings.spacing ?? "md"}
          >
            <option value="sm">작게</option>
            <option value="md">보통</option>
            <option value="lg">넓게</option>
          </ToolbarSelect>
        </>
      ) : null}

      {block.type === "spacer" ? (
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          높이
          <input
            className="h-8 w-20 rounded-sm border border-neutral-200 bg-white px-2 text-xs text-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
            min={0}
            onChange={(event) =>
              updateSettings({ height: Number(event.target.value) })
            }
            type="number"
            value={block.settings.height ?? 48}
          />
        </label>
      ) : null}
    </div>
  );
}

function BuilderBlockRenderer({
  block,
  editable,
  selected,
  sectionId,
  onSelectBlock,
  onChangeBlock
}: BlockRendererProps) {
  const selectBlock = () => {
    if (editable) {
      onSelectBlock?.(sectionId, block.id);
    }
  };
  const changeBlock = (nextBlock: BuilderBlock) => {
    onChangeBlock?.(sectionId, nextBlock);
  };
  const blockProps = {
    className: `${getBlockSelectionClass(Boolean(selected))} ${
      editable ? "cursor-text" : ""
    }`
  };
  const wrapEditableBlock = (children: React.ReactNode) => {
    if (!editable) {
      return children;
    }

    return (
      <div
        className={`relative ${selected ? "z-30" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          selectBlock();
        }}
        onMouseUp={(event) => {
          event.stopPropagation();
          selectBlock();
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          selectBlock();
        }}
      >
        {selected && onChangeBlock ? (
          <FloatingBlockToolbar block={block} onChange={changeBlock} />
        ) : null}
        {children}
      </div>
    );
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
        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as="h1"
              className={className}
              onChange={(text) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, text }
                })
              }
              onFocus={selectBlock}
              placeholder="제목 입력"
              value={block.content.text}
            />
          ) : (
            <h1 {...blockProps} className={className}>
              {block.content.text}
            </h1>
          )
        );
      }

      if (level === 3) {
        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as="h3"
              className={className}
              onChange={(text) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, text }
                })
              }
              onFocus={selectBlock}
              placeholder="제목 입력"
              value={block.content.text}
            />
          ) : (
            <h3 {...blockProps} className={className}>
              {block.content.text}
            </h3>
          )
        );
      }

      return wrapEditableBlock(
        editable ? (
          <InlineEditableText
            as="h2"
            className={className}
            onChange={(text) =>
              changeBlock({
                ...block,
                content: { ...block.content, text }
              })
            }
            onFocus={selectBlock}
            placeholder="제목 입력"
            value={block.content.text}
          />
        ) : (
          <h2 {...blockProps} className={className}>
            {block.content.text}
          </h2>
        )
      );
    }
    case "paragraph":
      return wrapEditableBlock(
        editable ? (
          <InlineEditableText
            as="p"
            className={`${blockProps.className} ${
              textWidthClass[block.settings.width ?? "content"]
            } whitespace-pre-line text-base leading-8 text-neutral-600 dark:text-neutral-300 ${
              alignClass[block.settings.align ?? "left"]
            } ${block.settings.align === "center" ? "mx-auto" : ""} ${
              block.settings.align === "right" ? "ml-auto" : ""
            }`}
            multiline
            onChange={(text) =>
              changeBlock({
                ...block,
                content: { ...block.content, text }
              })
            }
            onFocus={selectBlock}
            placeholder="본문 입력"
            value={block.content.text}
          />
        ) : (
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
        )
      );
    case "image":
      return wrapEditableBlock(
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
          {editable ? (
            <InlineEditableText
              as="figcaption"
              className="text-sm text-neutral-500 dark:text-neutral-400"
              onChange={(caption) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, caption }
                })
              }
              onFocus={selectBlock}
              placeholder="캡션 입력"
              value={block.content.caption ?? ""}
            />
          ) : block.content.caption ? (
            <figcaption className="text-sm text-neutral-500 dark:text-neutral-400">
              {block.content.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    case "gallery":
      return wrapEditableBlock(
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
              {editable ? (
                <InlineEditableText
                  as="figcaption"
                  className="text-sm text-neutral-500"
                  onChange={(caption) =>
                    changeBlock({
                      ...block,
                      content: {
                        images: block.content.images.map((item) =>
                          item === image ? { ...item, caption } : item
                        )
                      }
                    })
                  }
                  onFocus={selectBlock}
                  placeholder="캡션 입력"
                  value={image.caption ?? ""}
                />
              ) : image.caption ? (
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
        wrapEditableBlock(
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
            {editable ? (
              <InlineEditableText
                as="span"
                className={`inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                onChange={(label) =>
                  changeBlock({
                    ...block,
                    content: { ...block.content, label }
                  })
                }
                onFocus={selectBlock}
                placeholder="버튼"
                value={block.content.label}
              />
            ) : (
              <Link
                className={`inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                href={block.content.href}
              >
                {block.content.label}
              </Link>
            )}
          </div>
        )
      );
    }
    case "divider":
      return wrapEditableBlock(
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
      return wrapEditableBlock(
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
      return wrapEditableBlock(
        <div
          {...blockProps}
          className={blockProps.className}
          style={{ height: block.settings.height ?? 48 }}
        />
      );
    case "quote":
      return wrapEditableBlock(
        <blockquote
          {...blockProps}
          className={`${blockProps.className} max-w-4xl border-l-2 border-emerald-600 pl-6 text-2xl leading-10 text-neutral-900 dark:border-emerald-400 dark:text-neutral-100 ${
            block.settings.align === "center" ? "mx-auto text-center" : ""
          } ${block.settings.align === "right" ? "ml-auto text-right" : ""}`}
        >
          {editable ? (
            <InlineEditableText
              as="p"
              multiline
              onChange={(text) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, text }
                })
              }
              onFocus={selectBlock}
              placeholder="인용문 입력"
              value={block.content.text}
            />
          ) : (
            <p>{block.content.text}</p>
          )}
          {editable ? (
            <InlineEditableText
              as="cite"
              className="mt-4 block text-sm not-italic text-neutral-500"
              onChange={(author) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, author }
                })
              }
              onFocus={selectBlock}
              placeholder="출처 입력"
              value={block.content.author ?? ""}
            />
          ) : block.content.author ? (
            <cite className="mt-4 block text-sm not-italic text-neutral-500">
              {block.content.author}
            </cite>
          ) : null}
        </blockquote>
      );
    case "stats":
      return wrapEditableBlock(
        <div
          {...blockProps}
          className={`${blockProps.className} rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 ${
            alignClass[block.settings.align ?? "left"]
          }`}
        >
          {editable ? (
            <>
              <InlineEditableText
                as="p"
                className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50"
                onChange={(value) =>
                  changeBlock({
                    ...block,
                    content: { ...block.content, value }
                  })
                }
                onFocus={selectBlock}
                placeholder="값"
                value={block.content.value}
              />
              <InlineEditableText
                as="p"
                className="mt-2 text-sm text-neutral-500"
                onChange={(label) =>
                  changeBlock({
                    ...block,
                    content: { ...block.content, label }
                  })
                }
                onFocus={selectBlock}
                placeholder="라벨"
                value={block.content.label}
              />
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
                {block.content.value}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                {block.content.label}
              </p>
            </>
          )}
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
  onSelectBlock,
  onChangeBlock
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
          onChangeBlock={onChangeBlock}
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
  onSelectBlock,
  onChangeBlock
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
            onChangeBlock={onChangeBlock}
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
