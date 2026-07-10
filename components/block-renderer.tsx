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
import { Plus } from "lucide-react";

import {
  ImageLightbox,
  type LightboxImage
} from "@/components/image-lightbox";
import type {
  ProjectBlock,
  ProjectImage,
  ProjectTextFont,
  ProjectTextSettings
} from "@/lib/types";

export type ProjectBlockPath = Array<number | "left" | "right">;

type BlockRendererProps = {
  blocks: ProjectBlock[];
  editable?: boolean;
  selectedBlockPath?: ProjectBlockPath;
  onSelectBlock?: (path: ProjectBlockPath) => void;
  onChangeBlock?: (path: ProjectBlockPath, block: ProjectBlock) => void;
  onInsertBlock?: (path: ProjectBlockPath, type: ProjectBlock["type"]) => void;
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
  onChange: (value: string) => void;
  onFocus?: () => void;
  onMarkdownShortcut?: (value: string) => boolean;
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

function ProjectInsertionPoint({
  onInsertBlock,
  path
}: {
  onInsertBlock?: (path: ProjectBlockPath, type: ProjectBlock["type"]) => void;
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
        <div className="absolute left-1/2 top-[calc(100%+6px)] z-30 grid w-56 -translate-x-1/2 gap-1 rounded-md border border-neutral-200 bg-white p-2 text-sm shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          {projectInsertOptions.map((option) => (
            <button
              className="rounded-sm px-3 py-2 text-left text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
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

export function InlineEditableText({
  as,
  value,
  className,
  style,
  multiline,
  placeholder,
  onChange,
  onFocus,
  onMarkdownShortcut
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
  onChange
}: {
  block: ProjectBlock;
  onChange: (block: ProjectBlock) => void;
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
    </div>
  );
}

export function BlockRenderer({
  blocks,
  editable,
  selectedBlockPath,
  onSelectBlock,
  onChangeBlock,
  onInsertBlock
}: BlockRendererProps) {
  const [lightbox, setLightbox] = useState<ActiveLightbox | null>(null);

  const selectedKey = selectedBlockPath ? pathKey(selectedBlockPath) : "";

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

    return (
      <div
        className={`relative -m-1 rounded-md p-1 transition ${
          selected
            ? "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950"
            : "ring-1 ring-transparent hover:ring-neutral-300 dark:hover:ring-neutral-700"
        }`}
        data-project-block={pathKey(path)}
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
      >
        {selected && onChangeBlock ? (
          <FloatingProjectBlockToolbar
            block={block}
            onChange={(nextBlock) => changeBlock(path, nextBlock)}
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
                    multiline
                    onChange={(text) =>
                      changeBlock(path, {
                        ...block,
                        items: items.map((currentItem, currentIndex) =>
                          currentIndex === index ? text : currentItem
                        )
                      })
                    }
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
        key={key}
        onInsertBlock={onInsertBlock}
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
      {renderBlockList(blocks, [], "block")}
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
