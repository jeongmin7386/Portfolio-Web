"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  Fragment,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState
} from "react";

import { ProjectCard } from "@/components/project-card";
import { TagList } from "@/components/tag-list";
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderPage,
  BuilderSection,
  BuilderTabItem,
  BuilderTextFont,
  BuilderTextSettings,
  BuilderTextSize,
  Note,
  Project
} from "@/lib/types";

type BuilderPageRendererProps = {
  page: BuilderPage;
  projects: Project[];
  notes: Note[];
  projectBasePath?: string;
  editable?: boolean;
  selectedSectionId?: string;
  selectedBlockId?: string;
  onSelectSection?: (sectionId: string) => void;
  onSelectBlock?: (sectionId: string, blockId: string) => void;
  onChangeBlock?: (sectionId: string, block: BuilderBlock) => void;
  onInsertBlock?: (
    sectionId: string,
    insertIndex: number,
    type: BuilderBlockType
  ) => void;
  onDeleteBlock?: (sectionId: string, blockId: string) => void;
  onMoveBlock?: (
    sectionId: string,
    sourceBlockId: string,
    targetBlockId: string,
    placement: "before" | "after"
  ) => void;
  onInsertBlockIntoTab?: (
    sectionId: string,
    tabBlockId: string,
    tabId: string,
    type: BuilderBlockType,
    options?: { headingLevel?: 1 | 2 | 3 | 4 }
  ) => void;
  onMoveBlockIntoTab?: (
    sectionId: string,
    sourceBlockId: string,
    tabBlockId: string,
    tabId: string
  ) => void;
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

const textFontFamily: Record<BuilderTextFont, string> = {
  sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  display:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  serif: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
};

const legacyTextSizePt: Record<BuilderTextSize, number> = {
  xs: 9,
  sm: 10.5,
  base: 12,
  lg: 13.5,
  xl: 15,
  "2xl": 18,
  "3xl": 22.5,
  "4xl": 27,
  "5xl": 36,
  "6xl": 45,
  "7xl": 54
};

type TextStyleBlock = Extract<
  BuilderBlock,
  {
    type:
      | "heading"
      | "paragraph"
      | "bulletList"
      | "numberedList"
      | "button"
      | "quote"
      | "stats";
  }
>;

const textFontOptions: Array<{
  label: string;
  value: BuilderTextFont | "auto";
}> = [
  { label: "기본", value: "auto" },
  { label: "산세리프", value: "sans" },
  { label: "디스플레이", value: "display" },
  { label: "세리프", value: "serif" },
  { label: "모노", value: "mono" }
];

function isTextStyleBlock(block: BuilderBlock): block is TextStyleBlock {
  return (
    block.type === "heading" ||
    block.type === "paragraph" ||
    block.type === "bulletList" ||
    block.type === "numberedList" ||
    block.type === "button" ||
    block.type === "quote" ||
    block.type === "stats"
  );
}

function getTextStyle(settings: BuilderTextSettings): CSSProperties | undefined {
  const style: CSSProperties = {
    whiteSpace: "pre-line"
  };

  if (settings.color) {
    style.color = settings.color;
  }

  if (settings.fontFamily) {
    style.fontFamily = textFontFamily[settings.fontFamily];
  }

  const fontSizePt = settings.fontSizePt ?? (
    settings.fontSize ? legacyTextSizePt[settings.fontSize] : undefined
  );

  if (fontSizePt) {
    style.fontSize = `${fontSizePt}pt`;
    style.lineHeight = fontSizePt >= 32 ? "1.08" : fontSizePt >= 20 ? "1.2" : "1.6";
  }

  if (settings.lineHeight) {
    style.lineHeight = String(settings.lineHeight);
  }

  return Object.keys(style).length ? style : undefined;
}

function getColorPickerValue(color?: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color ?? "") ? color! : "#111111";
}

function getSectionStyle(section: BuilderSection): CSSProperties {
  const style: CSSProperties = {
    backgroundColor:
      section.settings.backgroundColor &&
      section.settings.backgroundColor !== "transparent"
        ? section.settings.backgroundColor
        : undefined,
    color: section.settings.textColor || undefined
  };

  const backgroundImage = section.settings.backgroundImage?.trim();

  if (backgroundImage) {
    const overlay =
      section.settings.backgroundOverlay === "dark"
        ? "linear-gradient(rgba(0,0,0,.38), rgba(0,0,0,.38))"
        : section.settings.backgroundOverlay === "light"
          ? "linear-gradient(rgba(255,255,255,.68), rgba(255,255,255,.68))"
          : "";

    style.backgroundImage = overlay
      ? `${overlay}, url(${JSON.stringify(backgroundImage)})`
      : `url(${JSON.stringify(backgroundImage)})`;
    style.backgroundPosition =
      section.settings.backgroundImagePosition ?? "center";
    style.backgroundRepeat = "no-repeat";
    style.backgroundSize = section.settings.backgroundImageSize ?? "cover";
  }

  return style;
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

function getBuilderTabBlocks(tab: BuilderTabItem): BuilderBlock[] {
  if (tab.blocks?.length) {
    return tab.blocks;
  }

  if (!tab.text?.trim()) {
    return [];
  }

  return [
    {
      id: `${tab.id}-legacy-text`,
      type: "paragraph",
      order: 0,
      content: {
        text: tab.text
      },
      settings: {
        align: "left",
        width: "content"
      }
    }
  ];
}

function orderBuilderBlocks(blocks: BuilderBlock[]) {
  return blocks.map((block, order) => ({ ...block, order })) as BuilderBlock[];
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

const builderInsertOptions: Array<{ label: string; type: BuilderBlockType }> = [
  { label: "제목", type: "heading" },
  { label: "본문", type: "paragraph" },
  { label: "글머리 목록", type: "bulletList" },
  { label: "번호 목록", type: "numberedList" },
  { label: "탭", type: "tabs" },
  { label: "이미지", type: "image" },
  { label: "갤러리", type: "gallery" },
  { label: "버튼", type: "button" },
  { label: "인용", type: "quote" },
  { label: "구분선", type: "divider" },
  { label: "여백", type: "spacer" },
  { label: "임베드", type: "embed" },
  { label: "지표", type: "stats" }
];

type BuilderTabInsertOption = {
  aliases: string[];
  headingLevel?: 1 | 2 | 3 | 4;
  label: string;
  type: BuilderBlockType;
};

const builderTabInsertOptions: BuilderTabInsertOption[] = [
  { aliases: ["/#", "/h1"], headingLevel: 1, label: "제목 1", type: "heading" },
  { aliases: ["/##", "/h2"], headingLevel: 2, label: "제목 2", type: "heading" },
  { aliases: ["/###", "/h3"], headingLevel: 3, label: "제목 3", type: "heading" },
  { aliases: ["/####", "/h4"], headingLevel: 4, label: "제목 4", type: "heading" },
  { aliases: ["/text", "/본문"], label: "본문", type: "paragraph" },
  { aliases: ["/-", "/bullet", "/글머리"], label: "글머리 목록", type: "bulletList" },
  { aliases: ["/1.", "/number", "/번호"], label: "번호 목록", type: "numberedList" },
  { aliases: ["/tabs", "/탭"], label: "탭", type: "tabs" },
  { aliases: ["/image", "/이미지"], label: "이미지", type: "image" },
  { aliases: ["/gallery", "/갤러리"], label: "갤러리", type: "gallery" },
  { aliases: ["/button", "/버튼"], label: "버튼", type: "button" },
  { aliases: ["/quote", "/인용"], label: "인용", type: "quote" },
  { aliases: ["/divider", "/구분선"], label: "구분선", type: "divider" },
  { aliases: ["/spacer", "/여백"], label: "여백", type: "spacer" },
  { aliases: ["/embed", "/임베드"], label: "임베드", type: "embed" },
  { aliases: ["/stats", "/지표"], label: "지표", type: "stats" }
];

function getBuilderTabCommandMatches(value: string) {
  const query = value.trim().toLowerCase();

  if (!query.startsWith("/")) {
    return [];
  }

  return builderTabInsertOptions.filter((option) =>
    option.aliases.some((alias) => alias.toLowerCase().startsWith(query))
  );
}

function BuilderInsertionPoint({
  insertIndex,
  onInsertBlock,
  sectionId
}: {
  insertIndex: number;
  onInsertBlock?: (
    sectionId: string,
    insertIndex: number,
    type: BuilderBlockType
  ) => void;
  sectionId: string;
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
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />
      <button
        aria-expanded={open}
        aria-label="이 위치에 블록 추가"
        className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
          open
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 focus:scale-100 focus:opacity-100"
        }`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Plus aria-hidden size={18} />
      </button>
      {open ? (
        <div className="absolute left-1/2 top-[calc(100%+6px)] z-30 grid w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 grid-cols-2 gap-2 rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-xl dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-3">
          {builderInsertOptions.map((option) => (
            <button
              className="min-h-12 rounded-sm border border-transparent px-3 py-2 text-left text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
              key={option.type}
              onClick={() => {
                onInsertBlock(sectionId, insertIndex, option.type);
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

type BlockRendererProps = {
  block: BuilderBlock;
  editable?: boolean;
  selected?: boolean;
  selectedBlockId?: string;
  sectionId: string;
  onSelectBlock?: (sectionId: string, blockId: string) => void;
  onChangeBlock?: (sectionId: string, block: BuilderBlock) => void;
  onDeleteBlock?: (sectionId: string, blockId: string) => void;
  onMoveBlock?: (
    sectionId: string,
    sourceBlockId: string,
    targetBlockId: string,
    placement: "before" | "after"
  ) => void;
  onInsertBlockIntoTab?: (
    sectionId: string,
    tabBlockId: string,
    tabId: string,
    type: BuilderBlockType,
    options?: { headingLevel?: 1 | 2 | 3 | 4 }
  ) => void;
  onMoveBlockIntoTab?: (
    sectionId: string,
    sourceBlockId: string,
    tabBlockId: string,
    tabId: string
  ) => void;
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

function InlineEditableText({
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
    style,
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

type FloatingBlockToolbarProps = {
  block: BuilderBlock;
  onChange: (block: BuilderBlock) => void;
  onDelete: () => void;
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

function ToolbarNumberInput({
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

function FloatingBlockToolbar({
  block,
  onChange,
  onDelete
}: FloatingBlockToolbarProps) {
  const [isColorOpen, setIsColorOpen] = useState(false);
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

  const updateTextSettings = (settings: Partial<BuilderTextSettings>) => {
    if (!isTextStyleBlock(block)) {
      return;
    }

    onChange({
      ...block,
      settings: {
        ...block.settings,
        ...settings
      } as TextStyleBlock["settings"]
    } as TextStyleBlock);
  };

  return (
    <div
      className={frameClass}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {isTextStyleBlock(block) ? (
        <>
          <ToolbarSelect
            label="폰트"
            onChange={(fontFamily) =>
              updateTextSettings({
                fontFamily:
                  fontFamily === "auto"
                    ? undefined
                    : (fontFamily as BuilderTextFont)
              })
            }
            value={block.settings.fontFamily ?? "auto"}
          >
            {textFontOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </ToolbarSelect>
          <ToolbarNumberInput
            label="크기"
            max={160}
            min={6}
            onChange={(fontSizePt) =>
              updateTextSettings({
                fontSize: undefined,
                fontSizePt
              })
            }
            placeholder="자동"
            value={
              block.settings.fontSizePt ??
              (block.settings.fontSize
                ? legacyTextSizePt[block.settings.fontSize]
                : undefined)
            }
          />
          <ToolbarNumberInput
            label="줄간격"
            max={3}
            min={0.8}
            onChange={(lineHeight) => updateTextSettings({ lineHeight })}
            placeholder="자동"
            step={0.05}
            suffix="배"
            value={block.settings.lineHeight}
          />
          <div className="relative">
            <ToolbarButton
              active={isColorOpen || Boolean(block.settings.color)}
              onClick={() => setIsColorOpen((current) => !current)}
            >
              색
            </ToolbarButton>
            {isColorOpen ? (
              <div
                className="absolute left-0 top-10 z-50 grid w-56 gap-3 rounded-md border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
              >
                <label className="grid gap-2 text-xs font-medium text-neutral-500">
                  글씨 색
                  <input
                    aria-label="글씨 색 선택"
                    className="h-16 w-full cursor-pointer rounded-md border border-neutral-200 bg-transparent p-1 dark:border-neutral-800"
                    onChange={(event) =>
                      updateTextSettings({ color: event.target.value })
                    }
                    type="color"
                    value={getColorPickerValue(block.settings.color)}
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
                    value={block.settings.color ?? ""}
                  />
                </label>
                <button
                  className="inline-flex h-8 items-center justify-center rounded-sm border border-neutral-200 px-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-200"
                  onClick={() => updateTextSettings({ color: undefined })}
                  type="button"
                >
                  기본색
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {block.type === "heading" ? (
        <>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((level) => (
              <ToolbarButton
                active={(block.settings.level ?? 2) === level}
                key={level}
                onClick={() =>
                  onChange({
                    ...block,
                    settings: {
                      ...block.settings,
                      level: level as 1 | 2 | 3 | 4
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

      {block.type === "quote" ||
      block.type === "stats" ||
      block.type === "bulletList" ||
      block.type === "numberedList" ? (
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

      {block.type === "tabs" ? (
        <ToolbarSelect
          label="탭"
          onChange={(style) =>
            updateSettings({ style: style as "soft" | "line" })
          }
          value={block.settings.style ?? "soft"}
        >
          <option value="soft">버튼형</option>
          <option value="line">밑줄형</option>
        </ToolbarSelect>
      ) : null}
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

function BuilderBlockRenderer({
  block,
  editable,
  selected,
  selectedBlockId,
  sectionId,
  onSelectBlock,
  onChangeBlock,
  onDeleteBlock,
  onMoveBlock,
  onInsertBlockIntoTab,
  onMoveBlockIntoTab
}: BlockRendererProps) {
  const selectBlock = () => {
    if (editable) {
      onSelectBlock?.(sectionId, block.id);
    }
  };
  const changeBlock = (nextBlock: BuilderBlock) => {
    onChangeBlock?.(sectionId, nextBlock);
  };
  const deleteBlock = () => {
    onDeleteBlock?.(sectionId, block.id);
  };
  const [activeTabId, setActiveTabId] = useState("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [tabCommandValue, setTabCommandValue] = useState("");
  const [isTabCommandOpen, setIsTabCommandOpen] = useState(false);
  const [isTabAddMenuOpen, setIsTabAddMenuOpen] = useState(false);
  const [selectedTabCommandIndex, setSelectedTabCommandIndex] = useState(0);
  const optionsOpen = Boolean(selected && isOptionsOpen);
  const tabCommandMatches = getBuilderTabCommandMatches(tabCommandValue);

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
        className={`group relative ${selected || optionsOpen ? "z-30" : ""}`}
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
        onDragOver={(event) => {
          if (
            event.dataTransfer.types.includes("application/x-studio-builder-block")
          ) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(event) => {
          const payload = event.dataTransfer.getData(
            "application/x-studio-builder-block"
          );

          if (!payload) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          try {
            const source = JSON.parse(payload) as {
              sectionId?: string;
              blockId?: string;
            };

            if (
              source.sectionId !== sectionId ||
              !source.blockId ||
              source.blockId === block.id
            ) {
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const placement =
              event.clientY < rect.top + rect.height / 2 ? "before" : "after";

            onMoveBlock?.(sectionId, source.blockId, block.id, placement);
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
                : "opacity-0 group-hover:opacity-100"
            }`}
            onClick={(event) => {
              event.stopPropagation();
              selectBlock();
              setIsOptionsOpen((current) => !current);
            }}
            draggable
            onDragStart={(event) => {
              event.stopPropagation();
              selectBlock();
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "application/x-studio-builder-block",
                JSON.stringify({ sectionId, blockId: block.id })
              );
            }}
            onMouseDown={(event) => event.stopPropagation()}
            type="button"
          >
            <SlidersHorizontal aria-hidden size={15} />
          </button>
        ) : null}
        {optionsOpen && onChangeBlock ? (
          <FloatingBlockToolbar
            block={block}
            onChange={changeBlock}
            onDelete={deleteBlock}
          />
        ) : null}
        {children}
      </div>
    );
  };

  const insertBlockIntoActiveTab = (
    tabId: string | undefined,
    option: BuilderTabInsertOption
  ) => {
    if (!tabId) {
      return;
    }

    onInsertBlockIntoTab?.(
      sectionId,
      block.id,
      tabId,
      option.type,
      option.headingLevel ? { headingLevel: option.headingLevel } : undefined
    );
    setTabCommandValue("");
    setIsTabCommandOpen(false);
    setIsTabAddMenuOpen(false);
    setSelectedTabCommandIndex(0);
    selectBlock();
  };

  const handleTabCommandKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
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
        tabId,
        tabCommandMatches[selectedTabCommandIndex] ?? tabCommandMatches[0]
      );
    }
  };

  switch (block.type) {
    case "heading": {
      const level = block.settings.level ?? 2;
      const textStyle = getTextStyle(block.settings);
      const className = `${blockProps.className} ${
        alignClass[block.settings.align ?? "left"]
      } ${
        level === 1
          ? "font-display text-5xl font-semibold leading-[1.04] tracking-normal text-neutral-950 dark:text-neutral-50 md:text-7xl"
          : level === 2
            ? "font-display text-3xl font-semibold tracking-normal text-neutral-950 dark:text-neutral-50 md:text-5xl"
            : level === 3
              ? "text-2xl font-semibold text-neutral-950 dark:text-neutral-50"
              : "text-xl font-semibold text-neutral-950 dark:text-neutral-50"
      }`;

      if (level === 1) {
        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as="h1"
              className={className}
              multiline
              onChange={(text) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, text }
                })
              }
              onFocus={selectBlock}
              placeholder="제목 입력"
              style={textStyle}
              value={block.content.text}
            />
          ) : (
            <h1 {...blockProps} className={className} style={textStyle}>
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
              multiline
              onChange={(text) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, text }
                })
              }
              onFocus={selectBlock}
              placeholder="제목 입력"
              style={textStyle}
              value={block.content.text}
            />
          ) : (
            <h3 {...blockProps} className={className} style={textStyle}>
              {block.content.text}
            </h3>
          )
        );
      }

      if (level === 4) {
        return wrapEditableBlock(
          editable ? (
            <InlineEditableText
              as="h4"
              className={className}
              multiline
              onChange={(text) =>
                changeBlock({
                  ...block,
                  content: { ...block.content, text }
                })
              }
              onFocus={selectBlock}
              placeholder="?쒕ぉ ?낅젰"
              style={textStyle}
              value={block.content.text}
            />
          ) : (
            <h4 {...blockProps} className={className} style={textStyle}>
              {block.content.text}
            </h4>
          )
        );
      }

      return wrapEditableBlock(
        editable ? (
          <InlineEditableText
            as="h2"
            className={className}
            multiline
            onChange={(text) =>
              changeBlock({
                ...block,
                content: { ...block.content, text }
              })
            }
            onFocus={selectBlock}
            placeholder="제목 입력"
            style={textStyle}
            value={block.content.text}
          />
        ) : (
          <h2 {...blockProps} className={className} style={textStyle}>
            {block.content.text}
          </h2>
        )
      );
    }
    case "paragraph": {
      const textStyle = getTextStyle(block.settings);

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
            onMarkdownShortcut={(text) => {
              const trimmedText = text.trim();

              if (trimmedText === "-" || trimmedText === "1.") {
                changeBlock({
                  ...block,
                  type: trimmedText === "-" ? "bulletList" : "numberedList",
                  content: { items: [""] },
                  settings: {
                    align: block.settings.align,
                    color: block.settings.color,
                    fontFamily: block.settings.fontFamily,
                    fontSize: block.settings.fontSize,
                    fontSizePt: block.settings.fontSizePt,
                    lineHeight: block.settings.lineHeight
                  }
                } as BuilderBlock);
                return true;
              }

              return false;
            }}
            placeholder="본문 입력"
            style={textStyle}
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
            style={textStyle}
          >
            {block.content.text}
          </p>
        )
      );
    }
    case "bulletList":
    case "numberedList": {
      const ListTag = block.type === "numberedList" ? "ol" : "ul";
      const textStyle = getTextStyle(block.settings);
      const items = block.content.items.length ? block.content.items : [""];
      const className = `${blockProps.className} ${
        block.type === "numberedList" ? "list-decimal" : "list-disc"
      } max-w-3xl space-y-2 pl-6 text-base leading-8 text-neutral-600 dark:text-neutral-300 ${
        alignClass[block.settings.align ?? "left"]
      } ${block.settings.align === "center" ? "mx-auto" : ""} ${
        block.settings.align === "right" ? "ml-auto" : ""
      }`;

      return wrapEditableBlock(
        <ListTag {...blockProps} className={className} style={textStyle}>
          {items.map((item, index) => (
            <li key={`${block.id}-${index}`}>
              {editable ? (
                <InlineEditableText
                  as="span"
                  focusKey={`${block.id}-list-${index}`}
                  multiline
                  onChange={(text) =>
                    changeBlock({
                      ...block,
                      content: {
                        items: items.map((currentItem, currentIndex) =>
                          currentIndex === index ? text : currentItem
                        )
                      }
                    })
                  }
                  onEnterKey={() => {
                    const nextItems = [...items];
                    const nextIndex = index + 1;

                    nextItems.splice(nextIndex, 0, "");
                    changeBlock({
                      ...block,
                      content: { items: nextItems }
                    });
                    focusEditableText(`${block.id}-list-${nextIndex}`);
                    return true;
                  }}
                  onFocus={selectBlock}
                  placeholder="목록 항목"
                  value={item}
                />
              ) : (
                item
              )}
            </li>
          ))}
        </ListTag>
      );
    }
    case "tabs": {
      const tabs = block.content.tabs.length
        ? block.content.tabs
        : [
            {
              id: "tab-empty",
              label: "탭 1",
              text: "빈 탭입니다. 내용을 입력하거나 탭을 추가해보세요."
            }
          ];
      const storedActiveId = block.settings.activeTabId;
      const currentActiveId = tabs.some((tab) => tab.id === activeTabId)
        ? activeTabId
        : tabs.some((tab) => tab.id === storedActiveId)
          ? storedActiveId
          : tabs[0]?.id;
      const activeTab = tabs.find((tab) => tab.id === currentActiveId) ?? tabs[0];
      const activeTabBlocks = getBuilderTabBlocks(activeTab);
      const isLineStyle = block.settings.style === "line";
      const updateTab = (
        tabId: string,
        patch: Partial<(typeof tabs)[number]>
      ) => {
        changeBlock({
          ...block,
          content: {
            tabs: tabs.map((tab) =>
              tab.id === tabId ? { ...tab, ...patch } : tab
            )
          }
        });
      };
      const updateActiveTabBlocks = (blocks: BuilderBlock[]) => {
        if (!activeTab?.id) {
          return;
        }

        updateTab(activeTab.id, {
          blocks: orderBuilderBlocks(blocks),
          text: ""
        });
      };
      const updateActiveTabBlock = (nextBlock: BuilderBlock) => {
        updateActiveTabBlocks(
          activeTabBlocks.map((tabBlock) =>
            tabBlock.id === nextBlock.id ? nextBlock : tabBlock
          )
        );
      };
      const deleteActiveTabBlock = (blockId: string) => {
        updateActiveTabBlocks(
          activeTabBlocks.filter((tabBlock) => tabBlock.id !== blockId)
        );
      };
      const moveActiveTabBlock = (
        sourceBlockId: string,
        targetBlockId: string,
        placement: "before" | "after"
      ) => {
        if (sourceBlockId === targetBlockId) {
          return;
        }

        const movingBlock = activeTabBlocks.find(
          (tabBlock) => tabBlock.id === sourceBlockId
        );
        const targetBlock = activeTabBlocks.find(
          (tabBlock) => tabBlock.id === targetBlockId
        );

        if (!movingBlock || !targetBlock) {
          return;
        }

        const nextBlocks = activeTabBlocks.filter(
          (tabBlock) => tabBlock.id !== sourceBlockId
        );
        const targetIndex = nextBlocks.findIndex(
          (tabBlock) => tabBlock.id === targetBlockId
        );

        if (targetIndex < 0) {
          return;
        }

        nextBlocks.splice(
          placement === "after" ? targetIndex + 1 : targetIndex,
          0,
          movingBlock
        );
        updateActiveTabBlocks(nextBlocks);
      };
      const addTab = () => {
        const tab = {
          id: createClientId("tab"),
          blocks: [],
          label: `탭 ${tabs.length + 1}`,
          text: ""
        };

        changeBlock({
          ...block,
          content: { tabs: [...tabs, tab] },
          settings: { ...block.settings, activeTabId: tab.id }
        });
        setActiveTabId(tab.id);
      };

      return wrapEditableBlock(
        <div
          {...blockProps}
          className={`${blockProps.className} rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950`}
        >
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
                    setActiveTabId(tab.id);
                    selectBlock();
                  }}
                  role="tab"
                  type="button"
                >
                  {editable ? (
                    <InlineEditableText
                      as="span"
                      onChange={(label) => updateTab(tab.id, { label })}
                      onFocus={selectBlock}
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
                  selectBlock();
                }}
                type="button"
              >
                <Plus aria-hidden size={18} />
              </button>
            ) : null}
          </div>
          <div
            className="mt-6 min-h-14 rounded-md border border-dashed border-transparent p-2 text-sm leading-7 text-neutral-600 transition dark:text-neutral-300"
            onDragOver={(event) => {
              if (
                editable &&
                onMoveBlockIntoTab &&
                event.dataTransfer.types.includes(
                  "application/x-studio-builder-block"
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
                "application/x-studio-builder-block"
              );

              if (!payload) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();

              try {
                const parsed = JSON.parse(payload) as {
                  blockId?: string;
                  sectionId?: string;
                };

                if (
                  parsed.sectionId === sectionId &&
                  parsed.blockId &&
                  parsed.blockId !== block.id
                ) {
                  onMoveBlockIntoTab(sectionId, parsed.blockId, block.id, activeTab.id);
                  selectBlock();
                }
              } catch {
                // 다른 드래그 데이터는 무시합니다.
              }
            }}
          >
            {activeTabBlocks.length > 0 ? (
              <div className="grid gap-4">
                {activeTabBlocks
                  .slice()
                  .sort((firstBlock, secondBlock) => firstBlock.order - secondBlock.order)
                  .map((tabBlock) => (
                    <BuilderBlockRenderer
                      block={tabBlock}
                      editable={editable}
                      key={tabBlock.id}
                      onChangeBlock={(_, nextBlock) => updateActiveTabBlock(nextBlock)}
                      onDeleteBlock={(_, blockId) => deleteActiveTabBlock(blockId)}
                      onMoveBlock={(_, sourceBlockId, targetBlockId, placement) =>
                        moveActiveTabBlock(sourceBlockId, targetBlockId, placement)
                      }
                      onSelectBlock={onSelectBlock}
                      sectionId={sectionId}
                      selected={selectedBlockId === tabBlock.id}
                      selectedBlockId={selectedBlockId}
                    />
                  ))}
              </div>
            ) : (
              <p className="text-neutral-400">
                빈 탭입니다. 아래 입력창에서 /로 블록을 추가할 수 있습니다.
              </p>
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
                    selectBlock();
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
                    selectBlock();
                    setIsTabCommandOpen(tabCommandValue.trimStart().startsWith("/"));
                  }}
                  onKeyDown={(event) =>
                    handleTabCommandKeyDown(event, activeTab.id)
                  }
                  placeholder="/ 입력으로 탭 안에 블록 추가"
                  value={tabCommandValue}
                />
                {isTabAddMenuOpen ? (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 grid w-[min(36rem,calc(100vw-2rem))] grid-cols-2 gap-2 rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-xl dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-3">
                    {builderTabInsertOptions.map((option) => (
                      <button
                        className="min-h-11 rounded-sm border border-transparent px-3 py-2 text-left text-neutral-700 transition hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
                        key={`${option.type}-${option.label}`}
                        onClick={() => insertBlockIntoActiveTab(activeTab.id, option)}
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
                        onClick={() => insertBlockIntoActiveTab(activeTab.id, option)}
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
        </div>
      );
    }
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
      const textStyle = getTextStyle(block.settings);
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
                style={textStyle}
                value={block.content.label}
              />
            ) : (
              <Link
                className={`inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium transition ${buttonClass}`}
                href={block.content.href}
                style={textStyle}
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
    case "quote": {
      const textStyle = getTextStyle(block.settings);

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
              style={textStyle}
              value={block.content.text}
            />
          ) : (
            <p style={textStyle}>{block.content.text}</p>
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
    }
    case "stats": {
      const textStyle = getTextStyle(block.settings);

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
                style={textStyle}
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
              <p
                className="text-3xl font-semibold text-neutral-950 dark:text-neutral-50"
                style={textStyle}
              >
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
}

function renderProjectList(
  section: BuilderSection,
  projects: Project[],
  projectBasePath = "/projects"
) {
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
            href={`${projectBasePath}/${project.slug}`}
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
        <ProjectCard
          key={project.slug}
          project={project}
          projectBasePath={projectBasePath}
        />
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
  projectBasePath,
  editable,
  selectedSectionId,
  selectedBlockId,
  onSelectSection,
  onSelectBlock,
  onChangeBlock,
  onInsertBlock,
  onDeleteBlock,
  onMoveBlock,
  onInsertBlockIntoTab,
  onMoveBlockIntoTab
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
      {editable ? (
        <BuilderInsertionPoint
          insertIndex={0}
          onInsertBlock={onInsertBlock}
          sectionId={section.id}
        />
      ) : null}
      {blocks.map((block, index) => (
        <Fragment key={block.id}>
          <BuilderBlockRenderer
            block={block}
            editable={editable}
            onChangeBlock={onChangeBlock}
            onDeleteBlock={onDeleteBlock}
            onInsertBlockIntoTab={onInsertBlockIntoTab}
            onMoveBlock={onMoveBlock}
            onMoveBlockIntoTab={onMoveBlockIntoTab}
            onSelectBlock={onSelectBlock}
            sectionId={section.id}
            selected={selectedBlockId === block.id}
            selectedBlockId={selectedBlockId}
          />
          {editable ? (
            <BuilderInsertionPoint
              insertIndex={index + 1}
              onInsertBlock={onInsertBlock}
              sectionId={section.id}
            />
          ) : null}
        </Fragment>
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
          <div className="mt-8">
            {renderProjectList(section, projects, projectBasePath)}
          </div>
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
  projectBasePath,
  editable,
  selectedSectionId,
  selectedBlockId,
  onSelectSection,
  onSelectBlock,
  onChangeBlock,
  onInsertBlock,
  onDeleteBlock,
  onMoveBlock,
  onInsertBlockIntoTab,
  onMoveBlockIntoTab
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
            onDeleteBlock={onDeleteBlock}
            onInsertBlock={onInsertBlock}
            onInsertBlockIntoTab={onInsertBlockIntoTab}
            onMoveBlock={onMoveBlock}
            onMoveBlockIntoTab={onMoveBlockIntoTab}
            onSelectBlock={onSelectBlock}
            onSelectSection={onSelectSection}
            page={page}
            projectBasePath={projectBasePath}
            projects={projects}
            section={section}
            selectedBlockId={selectedBlockId}
            selectedSectionId={selectedSectionId}
          />
        ))}
    </div>
  );
}
