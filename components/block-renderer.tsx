"use client";

import {
  Fragment,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ClipboardPaste, Copy, Plus, SlidersHorizontal, Trash2 } from "lucide-react";

import {
  ImageLightbox,
  type LightboxImage
} from "@/components/image-lightbox";
import type {
  ProjectBlock,
  ProjectImage,
  ProjectTabItem,
  ProjectTextFont,
  ProjectTextSettings
} from "@/lib/types";

export type ProjectBlockPath = Array<number | "left" | "right" | "tabs" | string>;
export type ProjectTabInsertOptions = { headingLevel?: 1 | 2 | 3 | 4 };

type BlockRendererProps = {
  blocks: ProjectBlock[];
  editable?: boolean;
  canPasteBlock?: boolean;
  pathPrefix?: ProjectBlockPath;
  selectedBlockPath?: ProjectBlockPath;
  onSelectBlock?: (path: ProjectBlockPath) => void;
  onCopyBlock?: (path: ProjectBlockPath, block: ProjectBlock) => void;
  onChangeBlock?: (path: ProjectBlockPath, block: ProjectBlock) => void;
  onInsertBlock?: (path: ProjectBlockPath, type: ProjectBlock["type"]) => void;
  onPasteBlock?: (path: ProjectBlockPath) => void;
  onDeleteBlock?: (path: ProjectBlockPath) => void;
  onMoveBlock?: (
    sourcePath: ProjectBlockPath,
    targetPath: ProjectBlockPath,
    placement: "before" | "after"
  ) => void;
  onInsertBlockIntoTab?: (
    tabPath: ProjectBlockPath,
    tabId: string,
    type: ProjectBlock["type"],
    options?: ProjectTabInsertOptions
  ) => void;
  onPasteBlockIntoTab?: (
    tabPath: ProjectBlockPath,
    tabId: string
  ) => void;
  onMoveBlockIntoTab?: (
    sourcePath: ProjectBlockPath,
    tabPath: ProjectBlockPath,
    tabId: string
  ) => void;
};

type ActiveLightbox = {
  images: LightboxImage[];
  index: number;
};

type InlineEditableTag =
  | "cite"
  | "figcaption"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "p"
  | "span";

type InlineEditableTextProps = {
  as: InlineEditableTag;
  value: string;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
  placeholder?: string;
  focusKey?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onMarkdownShortcut?: (value: string) => boolean;
  onEnterKey?: () => boolean;
};

const aspectRatioClass = {
  wide: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[4/5]"
};

const projectInsertOptions: Array<{
  label: string;
  type: ProjectBlock["type"];
}> = [
  { label: "제목", type: "heading" },
  { label: "본문", type: "paragraph" },
  { label: "글머리 목록", type: "bulletList" },
  { label: "번호 목록", type: "numberedList" },
  { label: "탭", type: "tabs" },
  { label: "이미지", type: "image" },
  { label: "갤러리", type: "imageGrid" },
  { label: "인용", type: "quote" },
  { label: "버튼", type: "button" },
  { label: "구분선", type: "divider" },
  { label: "여백", type: "spacer" },
  { label: "임베드", type: "embed" },
  { label: "2열", type: "twoColumn" },
  { label: "지표", type: "stats" },
  { label: "과정", type: "process" },
  { label: "결과", type: "result" }
];

type ProjectTabInsertOption = {
  aliases: string[];
  headingLevel?: 1 | 2 | 3 | 4;
  label: string;
  type: ProjectBlock["type"];
};

const projectTabInsertOptions: ProjectTabInsertOption[] = [
  { aliases: ["/#", "/h1"], headingLevel: 1, label: "제목 1", type: "heading" },
  { aliases: ["/##", "/h2"], headingLevel: 2, label: "제목 2", type: "heading" },
  { aliases: ["/###", "/h3"], headingLevel: 3, label: "제목 3", type: "heading" },
  { aliases: ["/####", "/h4"], headingLevel: 4, label: "제목 4", type: "heading" },
  { aliases: ["/text", "/본문"], label: "본문", type: "paragraph" },
  { aliases: ["/-", "/bullet", "/글머리"], label: "글머리 목록", type: "bulletList" },
  { aliases: ["/1.", "/number", "/번호"], label: "번호 목록", type: "numberedList" },
  { aliases: ["/tabs", "/탭"], label: "탭", type: "tabs" },
  { aliases: ["/image", "/이미지"], label: "이미지", type: "image" },
  { aliases: ["/gallery", "/갤러리"], label: "갤러리", type: "imageGrid" },
  { aliases: ["/quote", "/인용"], label: "인용", type: "quote" },
  { aliases: ["/button", "/버튼"], label: "버튼", type: "button" },
  { aliases: ["/divider", "/구분선"], label: "구분선", type: "divider" },
  { aliases: ["/spacer", "/여백"], label: "여백", type: "spacer" },
  { aliases: ["/embed", "/임베드"], label: "임베드", type: "embed" },
  { aliases: ["/two", "/2열"], label: "2열", type: "twoColumn" },
  { aliases: ["/stats", "/지표"], label: "지표", type: "stats" },
  { aliases: ["/process", "/과정"], label: "과정", type: "process" },
  { aliases: ["/result", "/결과"], label: "결과", type: "result" }
];

function getProjectTabCommandMatches(value: string) {
  const query = value.trim().toLowerCase();

  if (!query.startsWith("/")) {
    return [];
  }

  return projectTabInsertOptions.filter((option) =>
    option.aliases.some((alias) => alias.toLowerCase().startsWith(query))
  );
}

function ProjectInsertionPoint({
  canPasteBlock,
  onInsertBlock,
  onPasteBlock,
  path
}: {
  canPasteBlock?: boolean;
  onInsertBlock?: (path: ProjectBlockPath, type: ProjectBlock["type"]) => void;
  onPasteBlock?: (path: ProjectBlockPath) => void;
  path: ProjectBlockPath;
}) {
  const [open, setOpen] = useState(false);

  if (!onInsertBlock) {
    return null;
  }

  return (
    <div
      className="group relative z-20 -my-2 flex h-7 items-center justify-center"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`absolute inset-x-0 top-1/2 h-px bg-blue-500 transition ${
          open
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        }`}
      />
      <button
        aria-expanded={open}
        aria-label="이 위치에 블록 추가"
        className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
          open
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 focus:scale-100 focus:opacity-100 [@media(hover:none)]:scale-100 [@media(hover:none)]:opacity-100"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Plus aria-hidden size={18} />
      </button>
      {open ? (
        <div className="absolute left-1/2 top-[calc(100%+6px)] z-30 grid w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 grid-cols-2 gap-2 rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-xl dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-3">
          {canPasteBlock && onPasteBlock ? (
            <button
              className="min-h-12 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
              onClick={() => {
                onPasteBlock(path);
                setOpen(false);
              }}
              type="button"
            >
              <span className="flex items-center gap-2">
                <ClipboardPaste aria-hidden size={15} />
                붙여넣기
              </span>
            </button>
          ) : null}
          {projectInsertOptions.map((option) => (
            <button
              className="min-h-12 rounded-sm border border-transparent px-3 py-2 text-left text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
              key={option.type}
              onClick={() => {
                onInsertBlock(path, option.type);
                setOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const projectTextFontFamily: Record<NonNullable<ProjectTextSettings["fontFamily"]>, string> = {
  display:
    "var(--font-display), Pretendard, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
  sans:
    "Pretendard, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  serif: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif"
};

const projectTextFontOptions: Array<{
  label: string;
  value: ProjectTextFont | "auto";
}> = [
  { label: "자동", value: "auto" },
  { label: "Sans", value: "sans" },
  { label: "Display", value: "display" },
  { label: "Serif", value: "serif" },
  { label: "Mono", value: "mono" }
];

const projectAlignClass = {
  center: "text-center mx-auto",
  left: "text-left",
  right: "text-right ml-auto"
};

function getProjectTextStyle(settings: ProjectTextSettings): CSSProperties | undefined {
  const style: CSSProperties = {
    whiteSpace: "pre-line"
  };

  if (settings.color) {
    style.color = settings.color;
  }

  if (settings.fontFamily) {
    style.fontFamily = projectTextFontFamily[settings.fontFamily];
  }

  if (settings.fontSizePt) {
    style.fontSize = `${settings.fontSizePt}pt`;
    style.lineHeight =
      settings.fontSizePt >= 32 ? "1.08" : settings.fontSizePt >= 20 ? "1.2" : "1.6";
  }

  if (settings.lineHeight) {
    style.lineHeight = String(settings.lineHeight);
  }

  return Object.keys(style).length ? style : undefined;
}

function pathKey(path: ProjectBlockPath) {
  return path.join(".");
}

function normalizeOptionalText(value: string) {
  return value.trim() ? value : undefined;
}

function getColorPickerValue(color?: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color ?? "") ? color! : "#111111";
}

type TextStyleProjectBlock = Extract<
  ProjectBlock,
  {
    type:
      | "heading"
      | "paragraph"
      | "bulletList"
      | "numberedList"
      | "quote"
      | "button";
  }
>;

function isTextStyleProjectBlock(
  block: ProjectBlock
): block is TextStyleProjectBlock {
  return (
    block.type === "heading" ||
    block.type === "paragraph" ||
    block.type === "bulletList" ||
    block.type === "numberedList" ||
    block.type === "quote" ||
    block.type === "button"
  );
}

type ScrollSnapshot = {
  containers: Array<{
    element: HTMLElement;
    scrollLeft: number;
    scrollTop: number;
  }>;
  windowX: number;
  windowY: number;
};

function captureScrollSnapshot(element: HTMLElement): ScrollSnapshot {
  const containers: ScrollSnapshot["containers"] = [];
  let parent = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflow = `${style.overflow} ${style.overflowX} ${style.overflowY}`;
    const scrollable =
      /(auto|scroll|overlay)/.test(overflow) &&
      (parent.scrollHeight > parent.clientHeight ||
        parent.scrollWidth > parent.clientWidth);

    if (scrollable) {
      containers.push({
        element: parent,
        scrollLeft: parent.scrollLeft,
        scrollTop: parent.scrollTop
      });
    }

    parent = parent.parentElement;
  }

  return {
    containers,
    windowX: window.scrollX,
    windowY: window.scrollY
  };
}

function restoreScrollSnapshot(snapshot: ScrollSnapshot) {
  const restore = () => {
    snapshot.containers.forEach(({ element, scrollLeft, scrollTop }) => {
      element.scrollLeft = scrollLeft;
      element.scrollTop = scrollTop;
    });
    window.scrollTo(snapshot.windowX, snapshot.windowY);
  };

  window.requestAnimationFrame(() => {
    restore();
    window.requestAnimationFrame(restore);
  });
}

function createClientId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getProjectTabBlocks(tab: ProjectTabItem): ProjectBlock[] {
  if (tab.blocks?.length) {
    return tab.blocks;
  }

  if (!tab.text?.trim()) {
    return [];
  }

  return [
    {
      type: "paragraph",
      text: tab.text
    }
  ];
}

function focusEditableText(focusKey: string) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)
        ?.focus({ preventScroll: true });
    });
  });
}

export function InlineEditableText({
  as,
  value,
  className,
  style,
  multiline,
  placeholder,
  focusKey,
  onChange,
  onFocus,
  onMarkdownShortcut,
  onEnterKey
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
    "data-focus-key"?: string;
  } = {
    "aria-label": placeholder,
    "aria-multiline": multiline || undefined,
    className: editableClassName,
    contentEditable: true,
    "data-focus-key": focusKey,
    "data-placeholder": placeholder ?? "",
    dir: "ltr",
    draggable: false,
    style: {
      ...style,
      touchAction: "manipulation"
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      const nextValue = event.currentTarget.textContent ?? "";

      if (nextValue !== value) {
        onChange(nextValue);
      }
    },
    onClick: (event) => event.stopPropagation(),
    onDragStart: (event) => {
      event.preventDefault();
      event.stopPropagation();
    },
    onFocus,
    onInput: (event: FormEvent<HTMLElement>) =>
      onChange(event.currentTarget.textContent ?? ""),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" && !event.shiftKey && onEnterKey) {
        const scrollSnapshot = captureScrollSnapshot(event.currentTarget);
        const handled = onEnterKey();

        if (handled) {
          event.preventDefault();
          restoreScrollSnapshot(scrollSnapshot);
          return;
        }
      }

      if (event.key === " " && onMarkdownShortcut) {
        const handled = onMarkdownShortcut(
          event.currentTarget.textContent ?? ""
        );

        if (handled) {
          event.preventDefault();
          return;
        }
      }

      if (event.key === "Enter" && (multiline || event.shiftKey)) {
        event.preventDefault();
        const target = event.currentTarget;
        const scrollSnapshot = captureScrollSnapshot(target);

        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
          return;
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();

        const lineBreak = document.createTextNode("\n");
        range.insertNode(lineBreak);
        range.setStartAfter(lineBreak);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
        onChange(target.textContent ?? "");
        restoreScrollSnapshot(scrollSnapshot);
        return;
      }

      if (!multiline && event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    onMouseDown: (event) => event.stopPropagation(),
    onMouseUp: (event) => event.stopPropagation(),
    onPointerDown: (event) => event.stopPropagation(),
    onPointerUp: (event) => event.stopPropagation(),
    onTouchEnd: (event) => event.stopPropagation(),
    onTouchStart: (event) => event.stopPropagation(),
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
    case "h4":
      return <h4 {...editableProps} ref={setElementRef} />;
    case "p":
      return <p {...editableProps} ref={setElementRef} />;
    case "span":
      return <span {...editableProps} ref={setElementRef} />;
  }
}

function ProjectToolbarButton({
  active,
  children,
  onClick
}: {
  active?: boolean;
  children: ReactNode;
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

function ProjectToolbarSelect({
  label,
  value,
  children,
  onChange
}: {
  label: string;
  value: string | number;
  children: ReactNode;
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

function ProjectToolbarNumberInput({
  label,
  max,
  min,
  placeholder,
  step,
  suffix = "pt",
  value,
  onChange
}: {
  label: string;
  max?: number;
  min?: number;
  placeholder?: string;
  step?: number;
  suffix?: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-xs text-neutral-500">
      {label}
      <input
        className="h-8 w-16 rounded-sm border border-neutral-200 bg-white px-2 text-xs text-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
        max={max}
        min={min}
        step={step}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue ? Number(nextValue) : undefined);
        }}
        placeholder={placeholder}
        type="number"
        value={value ?? ""}
      />
      <span>{suffix}</span>
    </label>
  );
}

function ProjectAlignControls({
  value,
  onChange
}: {
  value: NonNullable<ProjectTextSettings["align"]>;
  onChange: (value: NonNullable<ProjectTextSettings["align"]>) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {(["left", "center", "right"] as const).map((align) => (
        <ProjectToolbarButton
          active={value === align}
          key={align}
          onClick={() => onChange(align)}
        >
          {align === "left" ? "좌" : align === "center" ? "중" : "우"}
        </ProjectToolbarButton>
      ))}
    </div>
  );
}

function FloatingProjectBlockToolbar({
  block,
  onChange,
  onCopy,
  onDelete
}: {
  block: ProjectBlock;
  onChange: (block: ProjectBlock) => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const [isColorOpen, setIsColorOpen] = useState(false);

  if (!isTextStyleProjectBlock(block)) {
    return null;
  }

  const updateTextSettings = (settings: Partial<ProjectTextSettings>) => {
    onChange({
      ...block,
      ...settings
    } as TextStyleProjectBlock);
  };

  return (
    <div
      className="absolute left-0 top-0 z-40 flex -translate-y-[calc(100%+8px)] flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <ProjectToolbarSelect
        label="폰트"
        onChange={(fontFamily) =>
          updateTextSettings({
            fontFamily:
              fontFamily === "auto" ? undefined : (fontFamily as ProjectTextFont)
          })
        }
        value={block.fontFamily ?? "auto"}
      >
        {projectTextFontOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </ProjectToolbarSelect>
      <ProjectToolbarNumberInput
        label="크기"
        max={160}
        min={6}
        onChange={(fontSizePt) => updateTextSettings({ fontSizePt })}
        placeholder="자동"
        value={block.fontSizePt}
      />
      <ProjectToolbarNumberInput
        label="줄간격"
        max={3}
        min={0.8}
        onChange={(lineHeight) => updateTextSettings({ lineHeight })}
        placeholder="자동"
        step={0.05}
        suffix="배"
        value={block.lineHeight}
      />
      <div className="relative">
        <ProjectToolbarButton
          active={isColorOpen || Boolean(block.color)}
          onClick={() => setIsColorOpen((current) => !current)}
        >
          색
        </ProjectToolbarButton>
        {isColorOpen ? (
          <div
            className="absolute left-0 top-10 z-50 grid w-56 gap-3 rounded-md border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <label className="grid gap-2 text-xs font-medium text-neutral-500">
              글자 색
              <input
                aria-label="글자 색 선택"
                className="h-16 w-full cursor-pointer rounded-md border border-neutral-200 bg-transparent p-1 dark:border-neutral-800"
                onChange={(event) =>
                  updateTextSettings({ color: event.target.value })
                }
                type="color"
                value={getColorPickerValue(block.color)}
              />
            </label>
            <label className="grid gap-2 text-xs font-medium text-neutral-500">
              색상값
              <input
                className="h-8 rounded-sm border border-neutral-200 bg-white px-2 text-xs text-neutral-800 outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                onChange={(event) =>
                  updateTextSettings({
                    color: event.target.value || undefined
                  })
                }
                placeholder="#111111"
                value={block.color ?? ""}
              />
            </label>
            <button
              className="inline-flex h-8 items-center justify-center rounded-sm border border-neutral-200 px-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-200"
              onClick={() => updateTextSettings({ color: undefined })}
              type="button"
            >
              기본값
            </button>
          </div>
        ) : null}
      </div>
      <ProjectAlignControls
        onChange={(align) => updateTextSettings({ align })}
        value={block.align ?? "left"}
      />
      {block.type === "heading" ? (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((level) => (
            <ProjectToolbarButton
              active={(block.level ?? 2) === level}
              key={level}
              onClick={() =>
                onChange({
                  ...block,
                  level: level as 1 | 2 | 3 | 4
                })
              }
            >
              H{level}
            </ProjectToolbarButton>
          ))}
        </div>
      ) : null}
      {block.type === "button" ? (
        <ProjectToolbarSelect
          label="형태"
          onChange={(variant) =>
            onChange({
              ...block,
              variant: variant as "primary" | "secondary" | "text"
            })
          }
          value={block.variant ?? "primary"}
        >
          <option value="primary">채움</option>
          <option value="secondary">외곽</option>
          <option value="text">텍스트</option>
        </ProjectToolbarSelect>
      ) : null}
      <button
        className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-sm border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600"
        onClick={onCopy}
        type="button"
      >
        <Copy aria-hidden size={14} />
        복사
      </button>
      <button
        className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-sm border border-red-200 bg-white px-2 text-xs font-medium text-red-700 transition hover:border-red-300 hover:text-red-800 dark:border-red-950 dark:bg-neutral-950 dark:text-red-300 dark:hover:border-red-800"
        onClick={onDelete}
        type="button"
      >
        <Trash2 aria-hidden size={14} />
        삭제
      </button>
    </div>
  );
}

function FloatingProjectBlockOptions({
  block,
  onChange,
  onCopy,
  onDelete
}: {
  block: ProjectBlock;
  onChange: (block: ProjectBlock) => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  if (isTextStyleProjectBlock(block)) {
    return (
      <FloatingProjectBlockToolbar
        block={block}
        onChange={onChange}
        onCopy={onCopy}
        onDelete={onDelete}
      />
    );
  }

  const frameClass =
    "absolute left-0 top-0 z-40 flex -translate-y-[calc(100%+8px)] flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95";

  const stopEvent = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

  return (
    <div
      className={frameClass}
      onClick={stopEvent}
      onMouseDown={stopEvent}
      onTouchStart={stopEvent}
    >
      <button
        className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-sm border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600"
        onClick={onCopy}
        type="button"
      >
        <Copy aria-hidden size={14} />
        복사
      </button>
      {block.type === "image" ? (
        <ProjectToolbarSelect
          label="비율"
          onChange={(aspectRatio) =>
            onChange({
              ...block,
              aspectRatio: aspectRatio as "wide" | "square" | "portrait"
            })
          }
          value={block.aspectRatio ?? "wide"}
        >
          <option value="wide">가로형</option>
          <option value="square">정방형</option>
          <option value="portrait">세로형</option>
        </ProjectToolbarSelect>
      ) : null}
      {block.type === "imageGrid" ? (
        <ProjectToolbarSelect
          label="열"
          onChange={(columns) =>
            onChange({ ...block, columns: Number(columns) as 2 | 3 })
          }
          value={block.columns ?? 3}
        >
          <option value={2}>2열</option>
          <option value={3}>3열</option>
        </ProjectToolbarSelect>
      ) : null}
      {block.type === "divider" ? (
        <>
          <ProjectToolbarSelect
            label="형태"
            onChange={(style) =>
              onChange({ ...block, style: style as "line" | "dashed" | "blank" })
            }
            value={block.style ?? "line"}
          >
            <option value="line">실선</option>
            <option value="dashed">점선</option>
            <option value="blank">여백</option>
          </ProjectToolbarSelect>
          <ProjectToolbarSelect
            label="간격"
            onChange={(spacing) =>
              onChange({ ...block, spacing: spacing as "sm" | "md" | "lg" })
            }
            value={block.spacing ?? "md"}
          >
            <option value="sm">좁게</option>
            <option value="md">보통</option>
            <option value="lg">넓게</option>
          </ProjectToolbarSelect>
        </>
      ) : null}
      {block.type === "embed" ? (
        <ProjectToolbarSelect
          label="비율"
          onChange={(ratio) =>
            onChange({ ...block, ratio: ratio as "wide" | "square" })
          }
          value={block.ratio ?? "wide"}
        >
          <option value="wide">와이드</option>
          <option value="square">정방형</option>
        </ProjectToolbarSelect>
      ) : null}
      {block.type === "spacer" ? (
        <ProjectToolbarNumberInput
          label="높이"
          min={0}
          onChange={(height) => onChange({ ...block, height })}
          suffix="px"
          value={block.height ?? 48}
        />
      ) : null}
      {block.type === "tabs" ? (
        <ProjectToolbarSelect
          label="탭"
          onChange={(style) =>
            onChange({ ...block, style: style as "soft" | "line" })
          }
          value={block.style ?? "soft"}
        >
          <option value="soft">버튼형</option>
          <option value="line">밑줄형</option>
        </ProjectToolbarSelect>
      ) : null}
      {[
        "image",
        "imageGrid",
        "divider",
        "embed",
        "spacer",
        "tabs"
      ].includes(block.type) ? null : (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          내용은 미리보기에서 바로 수정하세요.
        </span>
      )}
      <button
        className="inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-sm border border-red-200 bg-white px-2 text-xs font-medium text-red-700 transition hover:border-red-300 hover:text-red-800 dark:border-red-950 dark:bg-neutral-950 dark:text-red-300 dark:hover:border-red-800"
        onClick={onDelete}
        type="button"
      >
        <Trash2 aria-hidden size={14} />
        삭제
      </button>
    </div>
  );
}

export function BlockRenderer({
  blocks,
  editable,
  canPasteBlock,
  pathPrefix = [],
  selectedBlockPath,
  onSelectBlock,
  onCopyBlock,
  onChangeBlock,
  onInsertBlock,
  onPasteBlock,
  onDeleteBlock,
  onMoveBlock,
  onInsertBlockIntoTab,
  onPasteBlockIntoTab,
  onMoveBlockIntoTab
}: BlockRendererProps) {
  const [lightbox, setLightbox] = useState<ActiveLightbox | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const [openOptionsKey, setOpenOptionsKey] = useState("");
  const [tabCommandValue, setTabCommandValue] = useState("");
  const [isTabCommandOpen, setIsTabCommandOpen] = useState(false);
  const [isTabAddMenuOpen, setIsTabAddMenuOpen] = useState(false);
  const [selectedTabCommandIndex, setSelectedTabCommandIndex] = useState(0);

  const selectedKey = selectedBlockPath ? pathKey(selectedBlockPath) : "";
  const tabCommandMatches = getProjectTabCommandMatches(tabCommandValue);
  const touchDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);
  const suppressHandleClickRef = useRef(false);

  const openLightbox = (images: LightboxImage[], index: number) => {
    if (!editable) {
      setLightbox({ images, index });
    }
  };

  const selectBlock = (path: ProjectBlockPath) => {
    if (editable) {
      onSelectBlock?.(path);
    }
  };

  const changeBlock = (path: ProjectBlockPath, block: ProjectBlock) => {
    onChangeBlock?.(path, block);
  };
  const deleteBlock = (path: ProjectBlockPath) => {
    onDeleteBlock?.(path);
  };
  const insertBlockIntoActiveTab = (
    path: ProjectBlockPath,
    tabId: string | undefined,
    option: ProjectTabInsertOption
  ) => {
    if (!tabId) {
      return;
    }

    onInsertBlockIntoTab?.(
      path,
      tabId,
      option.type,
      option.headingLevel ? { headingLevel: option.headingLevel } : undefined
    );
    setTabCommandValue("");
    setIsTabCommandOpen(false);
    setIsTabAddMenuOpen(false);
    setSelectedTabCommandIndex(0);
    selectBlock(path);
  };

  const handleTabCommandKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    path: ProjectBlockPath,
    tabId: string | undefined
  ) => {
    if (event.key === "Escape") {
      setIsTabCommandOpen(false);
      setIsTabAddMenuOpen(false);
      return;
    }

    if (!isTabCommandOpen || tabCommandMatches.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedTabCommandIndex((current) =>
        Math.min(current + 1, tabCommandMatches.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedTabCommandIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      insertBlockIntoActiveTab(
        path,
        tabId,
        tabCommandMatches[selectedTabCommandIndex] ?? tabCommandMatches[0]
      );
    }
  };

  const wrapEditableBlock = (
    children: ReactNode,
    path: ProjectBlockPath,
    key: string,
    block: ProjectBlock
  ) => {
    if (!editable) {
      return <Fragment key={key}>{children}</Fragment>;
    }

    const selected = selectedKey === pathKey(path);
    const currentKey = pathKey(path);
    const optionsOpen = selected && openOptionsKey === currentKey;

    return (
      <div
        className={`group relative -m-1 rounded-md p-1 transition ${
          selected
            ? "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950"
            : "ring-1 ring-transparent hover:ring-neutral-300 dark:hover:ring-neutral-700"
        }`}
        data-project-block={pathKey(path)}
        data-project-block-path={JSON.stringify(path)}
        data-project-preview-block
        key={key}
        onClick={(event) => {
          event.stopPropagation();
          selectBlock(path);
        }}
        onMouseUp={(event) => {
          event.stopPropagation();
          selectBlock(path);
        }}
        onTouchEnd={(event) => {
          event.stopPropagation();
          selectBlock(path);
        }}
        onDragOver={(event) => {
          if (
            event.dataTransfer.types.includes("application/x-studio-project-block")
          ) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(event) => {
          const payload = event.dataTransfer.getData(
            "application/x-studio-project-block"
          );

          if (!payload) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          try {
            const source = JSON.parse(payload) as { path?: ProjectBlockPath };

            if (
              !Array.isArray(source.path) ||
              pathKey(source.path) === currentKey
            ) {
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const placement =
              event.clientY < rect.top + rect.height / 2 ? "before" : "after";

            onMoveBlock?.(source.path, path, placement);
          } catch {
            return;
          }
        }}
      >
        {onChangeBlock ? (
          <button
            aria-expanded={optionsOpen}
            aria-label="블록 옵션 열기"
            className={`absolute -left-4 top-1 z-40 inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-neutral-400 hover:text-neutral-950 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 ${
              selected || optionsOpen
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            }`}
            onClick={(event) => {
              event.stopPropagation();

              if (suppressHandleClickRef.current) {
                suppressHandleClickRef.current = false;
                return;
              }

              selectBlock(path);
              setOpenOptionsKey((key) => (key === currentKey ? "" : currentKey));
            }}
            draggable
            onDragStart={(event) => {
              event.stopPropagation();
              selectBlock(path);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "application/x-studio-project-block",
                JSON.stringify({ path })
              );
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerCancel={() => {
              touchDragRef.current = null;
            }}
            onPointerDown={(event) => {
              if (
                event.pointerType === "mouse" ||
                !editable ||
                !onMoveBlock
              ) {
                return;
              }

              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              touchDragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                dragging: false
              };
            }}
            onPointerMove={(event) => {
              const dragState = touchDragRef.current;

              if (!dragState || dragState.pointerId !== event.pointerId) {
                return;
              }

              const distance = Math.hypot(
                event.clientX - dragState.startX,
                event.clientY - dragState.startY
              );

              if (distance > 8) {
                dragState.dragging = true;
              }

              if (dragState.dragging) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            onPointerUp={(event) => {
              const dragState = touchDragRef.current;
              touchDragRef.current = null;

              if (!dragState || dragState.pointerId !== event.pointerId) {
                return;
              }

              if (!dragState.dragging) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();
              suppressHandleClickRef.current = true;

              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }

              const tabTarget = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>("[data-project-tab-drop-zone]");
              const rawTabPath = tabTarget?.dataset.projectTabPath;
              const tabId = tabTarget?.dataset.projectTabId;

              if (tabTarget && rawTabPath && tabId) {
                try {
                  const tabPath = JSON.parse(rawTabPath) as ProjectBlockPath;
                  const targetKey = pathKey(tabPath);

                  if (Array.isArray(tabPath) && targetKey !== currentKey) {
                    selectBlock(path);
                    onMoveBlockIntoTab?.(path, tabPath, tabId);
                    return;
                  }
                } catch {
                  return;
                }
              }

              const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest<HTMLElement>("[data-project-preview-block]");
              const rawTargetPath = target?.dataset.projectBlockPath;

              if (!target || !rawTargetPath) {
                return;
              }

              try {
                const targetPath = JSON.parse(rawTargetPath) as ProjectBlockPath;
                const targetKey = pathKey(targetPath);

                if (!Array.isArray(targetPath) || targetKey === currentKey) {
                  return;
                }

                const rect = target.getBoundingClientRect();
                const placement =
                  event.clientY < rect.top + rect.height / 2
                    ? "before"
                    : "after";

                selectBlock(path);
                onMoveBlock?.(path, targetPath, placement);
              } catch {
                return;
              }
            }}
            style={{ touchAction: "none" }}
            type="button"
          >
            <SlidersHorizontal aria-hidden size={15} />
          </button>
        ) : null}
        {optionsOpen && onChangeBlock ? (
          <FloatingProjectBlockOptions
            block={block}
            onChange={(nextBlock) => changeBlock(path, nextBlock)}
            onCopy={() => {
              onCopyBlock?.(path, block);
              setOpenOptionsKey("");
            }}
            onDelete={() => deleteBlock(path)}
          />
        ) : null}
        {children}
      </div>
    );
  };

  const renderImageFigure = (
    image: ProjectImage,
    images: ProjectImage[],
    index: number,
    aspectRatio: keyof typeof aspectRatioClass = "wide",
    onChangeCaption?: (caption: string) => void,
    fit: "cover" | "width" = "cover"
  ) => (
    <figure className="grid gap-3">
      <button
        aria-label={`이미지 크게 보기: ${image.alt}`}
        className={`group overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-900 ${
          fit === "width" ? "w-full" : aspectRatioClass[aspectRatio]
        }`}
        onClick={() => openLightbox(images, index)}
        type="button"
      >
        <Image
          alt={image.alt}
          className={
            fit === "width"
              ? "h-auto w-full object-contain"
              : "h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          }
          height={900}
          sizes="(min-width: 768px) 50vw, 100vw"
          src={image.src}
          unoptimized
          width={1200}
        />
      </button>
      {editable && onChangeCaption ? (
        <InlineEditableText
          as="figcaption"
          className="text-sm text-neutral-500 dark:text-neutral-400"
          onChange={onChangeCaption}
          placeholder="이미지 설명"
          value={image.caption ?? ""}
        />
      ) : image.caption ? (
        <figcaption className="text-sm text-neutral-500 dark:text-neutral-400">
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );

  const renderBlock = (
    block: ProjectBlock,
    key: string,
    path: ProjectBlockPath
  ) => {
    switch (block.type) {
      case "heading": {
        const HeadingTag =
          block.level === 1
            ? "h1"
            : block.level === 4
              ? "h4"
              : block.level === 3
                ? "h3"
                : "h2";
        const textStyle = getProjectTextStyle(block);
        const className = `${
          block.level === 1
            ? "mt-14 font-display text-4xl font-semibold leading-tight text-neutral-950 dark:text-neutral-50 md:text-5xl"
            : block.level === 4
            ? "mt-6 text-xl font-semibold text-neutral-950 dark:text-neutral-50"
            : block.level === 3
            ? "mt-8 text-2xl font-semibold text-neutral-950 dark:text-neutral-50"
            : "mt-14 text-3xl font-semibold text-neutral-950 dark:text-neutral-50"
        } ${projectAlignClass[block.align ?? "left"]}`;

        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as={HeadingTag}
              className={className}
              multiline
              onChange={(text) => changeBlock(path, { ...block, text })}
              onFocus={() => selectBlock(path)}
              placeholder="제목 입력"
              style={textStyle}
              value={block.text}
            />
          ) : (
            <HeadingTag className={className} style={textStyle}>
              {block.text}
            </HeadingTag>
          ),
          path,
          key,
          block
        );
      }
      case "paragraph": {
        const textStyle = getProjectTextStyle(block);
        const className = `max-w-3xl whitespace-pre-line text-base leading-8 text-neutral-700 dark:text-neutral-300 ${
          projectAlignClass[block.align ?? "left"]
        }`;

        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as="p"
              className={className}
              multiline
              onChange={(text) => changeBlock(path, { ...block, text })}
              onFocus={() => selectBlock(path)}
              onMarkdownShortcut={(text) => {
                const trimmedText = text.trim();

                if (trimmedText === "-" || trimmedText === "1.") {
                  changeBlock(path, {
                    type:
                      trimmedText === "-" ? "bulletList" : "numberedList",
                    items: [""],
                    align: block.align,
                    color: block.color,
                    fontFamily: block.fontFamily,
                    fontSizePt: block.fontSizePt,
                    lineHeight: block.lineHeight
                  } as ProjectBlock);
                  return true;
                }

                return false;
              }}
              placeholder="본문 입력"
              style={textStyle}
              value={block.text}
            />
          ) : (
            <p className={className} style={textStyle}>
              {block.text}
            </p>
          ),
          path,
          key,
          block
        );
      }
      case "bulletList":
      case "numberedList": {
        const ListTag = block.type === "numberedList" ? "ol" : "ul";
        const textStyle = getProjectTextStyle(block);
        const items = block.items.length ? block.items : [""];
        const className = `max-w-3xl ${
          block.type === "numberedList" ? "list-decimal" : "list-disc"
        } space-y-2 pl-6 text-base leading-8 text-neutral-700 dark:text-neutral-300 ${
          projectAlignClass[block.align ?? "left"]
        }`;

        return wrapEditableBlock(
          <ListTag className={className} style={textStyle}>
            {items.map((item, index) => (
              <li key={`${key}-item-${index}`}>
                {editable ? (
                  <InlineEditableText
                    as="span"
                    focusKey={`${pathKey(path)}-list-${index}`}
                    multiline
                    onChange={(text) =>
                      changeBlock(path, {
                        ...block,
                        items: items.map((currentItem, currentIndex) =>
                          currentIndex === index ? text : currentItem
                        )
                      })
                    }
                    onEnterKey={() => {
                      const nextItems = [...items];
                      const nextIndex = index + 1;

                      nextItems.splice(nextIndex, 0, "");
                      changeBlock(path, {
                        ...block,
                        items: nextItems
                      });
                      focusEditableText(`${pathKey(path)}-list-${nextIndex}`);
                      return true;
                    }}
                    onFocus={() => selectBlock(path)}
                    placeholder="목록 항목"
                    value={item}
                  />
                ) : (
                  item
                )}
              </li>
            ))}
          </ListTag>,
          path,
          key,
          block
        );
      }
      case "tabs": {
        const pathId = pathKey(path);
        const tabs = block.tabs.length
          ? block.tabs
          : [
              {
                id: "tab-empty",
                label: "탭 1",
                text: "빈 탭입니다. 내용을 입력하거나 탭을 추가해보세요."
              }
            ];
        const currentActiveId = tabs.some((tab) => tab.id === activeTabs[pathId])
          ? activeTabs[pathId]
          : tabs.some((tab) => tab.id === block.activeTabId)
            ? block.activeTabId
            : tabs[0]?.id;
        const activeTab =
          tabs.find((tab) => tab.id === currentActiveId) ?? tabs[0];
        const activeTabBlocks = getProjectTabBlocks(activeTab);
        const hasActiveTabStoredBlocks = Boolean(activeTab?.blocks?.length);
        const isLineStyle = block.style === "line";
        const updateTab = (
          tabId: string,
          patch: Partial<(typeof tabs)[number]>
        ) => {
          changeBlock(path, {
            ...block,
            tabs: tabs.map((tab) =>
              tab.id === tabId ? { ...tab, ...patch } : tab
            )
          });
        };
        const addTab = () => {
          const tab = {
            id: createClientId("tab"),
            blocks: [],
            label: `탭 ${tabs.length + 1}`,
            text: ""
          };

          changeBlock(path, {
            ...block,
            tabs: [...tabs, tab],
            activeTabId: tab.id
          });
          setActiveTabs((current) => ({ ...current, [pathId]: tab.id }));
        };

        return wrapEditableBlock(
          <div className="my-8 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div
              className="flex flex-wrap items-center gap-2"
              role="tablist"
              aria-label="탭 블록"
            >
              {tabs.map((tab) => {
                const active = tab.id === activeTab?.id;

                return (
                  <button
                    aria-selected={active}
                    className={
                      isLineStyle
                        ? `min-h-9 border-b px-2 text-sm transition ${
                            active
                              ? "border-neutral-950 text-neutral-950 dark:border-neutral-50 dark:text-neutral-50"
                              : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                          }`
                        : `min-h-9 rounded-md px-3 text-sm transition ${
                            active
                              ? "bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50"
                              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                          }`
                    }
                    key={tab.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveTabs((current) => ({
                        ...current,
                        [pathId]: tab.id
                      }));
                      selectBlock(path);
                    }}
                    role="tab"
                    type="button"
                  >
                    {editable ? (
                      <InlineEditableText
                        as="span"
                        onChange={(label) => updateTab(tab.id, { label })}
                        onFocus={() => selectBlock(path)}
                        placeholder="탭 이름"
                        value={tab.label}
                      />
                    ) : (
                      tab.label
                    )}
                  </button>
                );
              })}
              {editable ? (
                <button
                  aria-label="탭 추가"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
                  onClick={(event) => {
                    event.stopPropagation();
                    addTab();
                    selectBlock(path);
                  }}
                  type="button"
                >
                  <Plus aria-hidden size={18} />
                </button>
              ) : null}
            </div>
            <div
              className="mt-6 min-h-14 rounded-md border border-dashed border-transparent p-2 text-sm leading-7 text-neutral-600 transition dark:text-neutral-300"
              data-project-tab-drop-zone
              data-project-tab-id={activeTab?.id ?? ""}
              data-project-tab-path={JSON.stringify(path)}
              onMouseDown={(event) => {
                if (editable) {
                  event.stopPropagation();
                }
              }}
              onTouchStart={(event) => {
                if (editable) {
                  event.stopPropagation();
                }
              }}
              onDragOver={(event) => {
                if (
                  editable &&
                  onMoveBlockIntoTab &&
                  event.dataTransfer.types.includes(
                    "application/x-studio-project-block"
                  )
                ) {
                  event.preventDefault();
                  event.stopPropagation();
                  event.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(event) => {
                if (!editable || !onMoveBlockIntoTab || !activeTab?.id) {
                  return;
                }

                const payload = event.dataTransfer.getData(
                  "application/x-studio-project-block"
                );

                if (!payload) {
                  return;
                }

                event.preventDefault();
                event.stopPropagation();

                try {
                  const parsed = JSON.parse(payload) as {
                    path?: ProjectBlockPath;
                  };

                  if (Array.isArray(parsed.path)) {
                    onMoveBlockIntoTab(parsed.path, path, activeTab.id);
                    selectBlock(path);
                  }
                } catch {
                  // 다른 드래그 데이터는 무시합니다.
                }
              }}
            >
              {hasActiveTabStoredBlocks ? (
                <BlockRenderer
                  blocks={activeTabBlocks}
                  canPasteBlock={canPasteBlock}
                  editable={editable}
                  onChangeBlock={onChangeBlock}
                  onCopyBlock={onCopyBlock}
                  onDeleteBlock={onDeleteBlock}
                  onInsertBlock={onInsertBlock}
                  onInsertBlockIntoTab={onInsertBlockIntoTab}
                  onMoveBlock={onMoveBlock}
                  onMoveBlockIntoTab={onMoveBlockIntoTab}
                  onPasteBlock={onPasteBlock}
                  onPasteBlockIntoTab={onPasteBlockIntoTab}
                  onSelectBlock={onSelectBlock}
                  pathPrefix={[...path, "tabs", activeTab.id]}
                  selectedBlockPath={selectedBlockPath}
                />
              ) : (
                <>
                  {editable && activeTab?.id ? (
                    <InlineEditableText
                      as="p"
                      className="text-neutral-700 dark:text-neutral-200"
                      multiline
                      onChange={(text) => updateTab(activeTab.id, { text })}
                      onFocus={() => selectBlock(path)}
                      placeholder="탭 내용을 입력하세요"
                      value={activeTab.text ?? ""}
                    />
                  ) : activeTab?.text ? (
                    <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-200">
                      {activeTab.text}
                    </p>
                  ) : (
                    <p className="text-neutral-400">
                      빈 탭입니다. 아래 입력창에서 /로 블록을 추가할 수 있습니다.
                    </p>
                  )}
                </>
              )}
              {editable && activeTab?.id ? (
                <div
                  className="relative mt-4 flex w-full max-w-xl items-center gap-2 rounded-full border border-neutral-200 bg-white/90 p-1.5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    aria-expanded={isTabAddMenuOpen}
                    aria-label="탭 안에 블록 추가"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-neutral-50 dark:text-neutral-950"
                    onClick={() => {
                      setIsTabAddMenuOpen((current) => !current);
                      setIsTabCommandOpen(false);
                      selectBlock(path);
                    }}
                    type="button"
                  >
                    <Plus aria-hidden size={17} />
                  </button>
                  <input
                    className="min-w-0 flex-1 bg-transparent px-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
                    onChange={(event) => {
                      const value = event.target.value;
                      setTabCommandValue(value);
                      setSelectedTabCommandIndex(0);
                      setIsTabCommandOpen(value.trimStart().startsWith("/"));
                      setIsTabAddMenuOpen(false);
                    }}
                    onFocus={() => {
                      selectBlock(path);
                      setIsTabCommandOpen(tabCommandValue.trimStart().startsWith("/"));
                    }}
                    onKeyDown={(event) =>
                      handleTabCommandKeyDown(event, path, activeTab.id)
                    }
                    placeholder="/ 입력으로 탭 안에 블록 추가"
                    value={tabCommandValue}
                  />
                  {isTabAddMenuOpen ? (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 grid w-[min(36rem,calc(100vw-2rem))] grid-cols-2 gap-2 rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-xl dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-3">
                      {canPasteBlock && onPasteBlockIntoTab ? (
                        <button
                          className="min-h-11 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                          onClick={() => {
                            onPasteBlockIntoTab(path, activeTab.id);
                            setIsTabAddMenuOpen(false);
                          }}
                          type="button"
                        >
                          <span className="flex items-center gap-2">
                            <ClipboardPaste aria-hidden size={15} />
                            붙여넣기
                          </span>
                        </button>
                      ) : null}
                      {projectTabInsertOptions.map((option) => (
                        <button
                          className="min-h-11 rounded-sm border border-transparent px-3 py-2 text-left text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
                          key={`${option.type}-${option.label}`}
                          onClick={() =>
                            insertBlockIntoActiveTab(path, activeTab.id, option)
                          }
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {isTabCommandOpen && tabCommandMatches.length > 0 ? (
                    <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 grid w-[min(32rem,calc(100vw-2rem))] gap-1 rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                      {tabCommandMatches.map((option, index) => (
                        <button
                          className={`rounded-sm px-3 py-2 text-left transition ${
                            index === selectedTabCommandIndex
                              ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                              : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                          }`}
                          key={`${option.type}-${option.label}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() =>
                            insertBlockIntoActiveTab(path, activeTab.id, option)
                          }
                          type="button"
                        >
                          <span className="font-medium">{option.label}</span>
                          <span className="ml-2 text-xs opacity-60">
                            {option.aliases[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>,
          path,
          key,
          block
        );
      }
      case "image": {
        const image = {
          src: block.src,
          alt: block.alt,
          caption: block.caption
        };

        return wrapEditableBlock(
          <div className="my-8">
            {renderImageFigure(
              image,
              [image],
              0,
              block.aspectRatio ?? "wide",
              (caption) =>
                changeBlock(path, {
                  ...block,
                  caption: normalizeOptionalText(caption)
                })
            )}
          </div>,
          path,
          key,
          block
        );
      }
      case "imageGrid": {
        const columns =
          block.columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

        return wrapEditableBlock(
          <div className={`my-8 grid gap-4 ${columns}`}>
            {block.images.map((image, index) => (
              <div key={`${key}-${image.src}-${index}`}>
                {renderImageFigure(
                  image,
                  block.images,
                  index,
                  "square",
                  (caption) =>
                    changeBlock(path, {
                      ...block,
                      images: block.images.map((currentImage, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentImage,
                              caption: normalizeOptionalText(caption)
                            }
                          : currentImage
                      )
                    }),
                  "width"
                )}
              </div>
            ))}
          </div>,
          path,
          key,
          block
        );
      }
      case "quote": {
        const quoteTextStyle = getProjectTextStyle(block);

        return wrapEditableBlock(
          <blockquote
            className={`my-10 max-w-3xl border-l-2 border-emerald-600 pl-6 text-2xl leading-10 text-neutral-900 dark:border-emerald-400 dark:text-neutral-100 ${
              projectAlignClass[block.align ?? "left"]
            }`}
            style={quoteTextStyle}
          >
            {editable ? (
              <InlineEditableText
                as="p"
                multiline
                onChange={(quote) => changeBlock(path, { ...block, quote })}
                onFocus={() => selectBlock(path)}
                placeholder="인용문 입력"
                style={quoteTextStyle}
                value={block.quote}
              />
            ) : (
              <p>{block.quote}</p>
            )}
            {editable ? (
              <InlineEditableText
                as="cite"
                className="mt-4 block text-sm not-italic text-neutral-500 dark:text-neutral-400"
                onChange={(cite) =>
                  changeBlock(path, {
                    ...block,
                    cite: normalizeOptionalText(cite)
                  })
                }
                onFocus={() => selectBlock(path)}
                placeholder="출처"
                value={block.cite ?? ""}
              />
            ) : block.cite ? (
              <cite className="mt-4 block text-sm not-italic text-neutral-500 dark:text-neutral-400">
                {block.cite}
              </cite>
            ) : null}
          </blockquote>,
          path,
          key,
          block
        );
      }
      case "button": {
        const textStyle = getProjectTextStyle(block);
        const variant = block.variant ?? "primary";
        const buttonClass =
          variant === "primary"
            ? "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
            : variant === "secondary"
              ? "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
              : "border-transparent bg-transparent px-0 text-neutral-950 underline-offset-4 hover:underline dark:text-neutral-50";
        const className = `inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium transition ${buttonClass}`;

        return wrapEditableBlock(
          <div className={`my-8 ${projectAlignClass[block.align ?? "left"]}`}>
            {editable ? (
              <span className={className} style={textStyle}>
                <InlineEditableText
                  as="span"
                  onChange={(label) => changeBlock(path, { ...block, label })}
                  onFocus={() => selectBlock(path)}
                  placeholder="버튼 문구"
                  style={textStyle}
                  value={block.label}
                />
              </span>
            ) : (
              <Link className={className} href={block.href} style={textStyle}>
                {block.label}
              </Link>
            )}
          </div>,
          path,
          key,
          block
        );
      }
      case "divider":
        return wrapEditableBlock(
          <div
            className={
              block.spacing === "lg"
                ? "py-10"
                : block.spacing === "sm"
                  ? "py-3"
                  : "py-6"
            }
          >
            {block.style === "blank" ? null : (
              <div
                className={`border-t border-neutral-200 dark:border-neutral-800 ${
                  block.style === "dashed" ? "border-dashed" : ""
                }`}
              />
            )}
          </div>,
          path,
          key,
          block
        );
      case "embed":
        return wrapEditableBlock(
          <div
            className={`my-8 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 ${
              block.ratio === "square" ? "aspect-square" : "aspect-video"
            }`}
          >
            <iframe
              className="h-full w-full"
              src={block.url}
              title={block.provider || "임베드 콘텐츠"}
            />
          </div>,
          path,
          key,
          block
        );
      case "spacer":
        return wrapEditableBlock(
          <div aria-hidden style={{ height: block.height ?? 48 }} />,
          path,
          key,
          block
        );
      case "twoColumn":
        return wrapEditableBlock(
          <div className="my-10 grid gap-8 border-y border-neutral-200 py-8 dark:border-neutral-800 md:grid-cols-2">
            <div className="grid content-start gap-5">
              {renderBlockList(block.left, [...path, "left"], `${key}-left`)}
            </div>
            <div className="grid content-start gap-5">
              {renderBlockList(block.right, [...path, "right"], `${key}-right`)}
            </div>
          </div>,
          path,
          key,
          block
        );
      case "stats":
        return wrapEditableBlock(
          <div className="my-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item, index) => (
              <div
                className="rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                key={`${item.label}-${index}`}
              >
                {editable ? (
                  <InlineEditableText
                    as="p"
                    className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50"
                    onChange={(value) =>
                      changeBlock(path, {
                        ...block,
                        items: block.items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, value }
                            : currentItem
                        )
                      })
                    }
                    onFocus={() => selectBlock(path)}
                    placeholder="값"
                    value={item.value}
                  />
                ) : (
                  <p className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
                    {item.value}
                  </p>
                )}
                {editable ? (
                  <InlineEditableText
                    as="p"
                    className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200"
                    onChange={(label) =>
                      changeBlock(path, {
                        ...block,
                        items: block.items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? { ...currentItem, label }
                            : currentItem
                        )
                      })
                    }
                    onFocus={() => selectBlock(path)}
                    placeholder="라벨"
                    value={item.label}
                  />
                ) : (
                  <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {item.label}
                  </p>
                )}
                {editable ? (
                  <InlineEditableText
                    as="p"
                    className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400"
                    multiline
                    onChange={(description) =>
                      changeBlock(path, {
                        ...block,
                        items: block.items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                description: normalizeOptionalText(description)
                              }
                            : currentItem
                        )
                      })
                    }
                    onFocus={() => selectBlock(path)}
                    placeholder="설명"
                    value={item.description ?? ""}
                  />
                ) : item.description ? (
                  <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>,
          path,
          key,
          block
        );
      case "process":
        return wrapEditableBlock(
          <ol className="my-10 grid gap-4">
            {block.steps.map((step, index) => (
              <li
                className="grid gap-4 border-t border-neutral-200 pt-5 dark:border-neutral-800 md:grid-cols-[64px_1fr]"
                key={`${step.title}-${index}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-950 text-sm font-semibold text-white dark:bg-neutral-100 dark:text-neutral-950">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  {editable ? (
                    <InlineEditableText
                      as="h3"
                      className="text-lg font-semibold text-neutral-950 dark:text-neutral-50"
                      onChange={(title) =>
                        changeBlock(path, {
                          ...block,
                          steps: block.steps.map((currentStep, currentIndex) =>
                            currentIndex === index
                              ? { ...currentStep, title }
                              : currentStep
                          )
                        })
                      }
                      onFocus={() => selectBlock(path)}
                      placeholder="단계 제목"
                      value={step.title}
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                      {step.title}
                    </h3>
                  )}
                  {editable ? (
                    <InlineEditableText
                      as="p"
                      className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-400"
                      multiline
                      onChange={(description) =>
                        changeBlock(path, {
                          ...block,
                          steps: block.steps.map((currentStep, currentIndex) =>
                            currentIndex === index
                              ? { ...currentStep, description }
                              : currentStep
                          )
                        })
                      }
                      onFocus={() => selectBlock(path)}
                      placeholder="단계 설명"
                      value={step.description}
                    />
                  ) : (
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>,
          path,
          key,
          block
        );
      case "result":
        return wrapEditableBlock(
          <section className="my-10 border-l-2 border-blue-600 pl-6 dark:border-blue-400">
            {editable ? (
              <InlineEditableText
                as="h3"
                className="text-xl font-semibold text-neutral-950 dark:text-neutral-50"
                onChange={(title) => changeBlock(path, { ...block, title })}
                onFocus={() => selectBlock(path)}
                placeholder="결과 제목"
                value={block.title}
              />
            ) : (
              <h3 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
                {block.title}
              </h3>
            )}
            {editable ? (
              <InlineEditableText
                as="p"
                className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-700 dark:text-neutral-300"
                multiline
                onChange={(items) =>
                  changeBlock(path, {
                    ...block,
                    items: items
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                }
                onFocus={() => selectBlock(path)}
                placeholder="결과를 줄바꿈으로 입력"
                value={block.items.join("\n")}
              />
            ) : (
              <ul className="mt-4 grid gap-2 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>,
          path,
          key,
          block
        );
      default:
        return null;
    }
  };

  const renderInsertionPoint = (path: ProjectBlockPath, key: string) => {
    if (!editable || !onInsertBlock) {
      return null;
    }

    return (
      <ProjectInsertionPoint
        canPasteBlock={canPasteBlock}
        key={key}
        onInsertBlock={onInsertBlock}
        onPasteBlock={onPasteBlock}
        path={path}
      />
    );
  };

  const renderBlockList = (
    blockList: ProjectBlock[],
    pathPrefix: ProjectBlockPath,
    keyPrefix: string
  ) => (
    <Fragment>
      {renderInsertionPoint([...pathPrefix, 0], `${keyPrefix}-insert-0`)}
      {blockList.map((block, index) => (
        <Fragment key={`${keyPrefix}-${index}`}>
          {renderBlock(block, `${keyPrefix}-${index}`, [...pathPrefix, index])}
          {renderInsertionPoint(
            [...pathPrefix, index + 1],
            `${keyPrefix}-insert-${index + 1}`
          )}
        </Fragment>
      ))}
    </Fragment>
  );

  return (
    <div className="grid gap-6">
      {renderBlockList(
        blocks,
        pathPrefix,
        pathPrefix.length ? `block-${pathKey(pathPrefix)}` : "block"
      )}
      <ImageLightbox
        activeIndex={lightbox?.index ?? null}
        images={lightbox?.images ?? []}
        onClose={() => setLightbox(null)}
        onSelect={(index) =>
          setLightbox((current) => (current ? { ...current, index } : current))
        }
      />
    </div>
  );
}
