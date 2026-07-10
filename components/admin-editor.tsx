"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Clipboard,
  GripVertical,
  LogOut,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  BlockRenderer,
  InlineEditableText,
  type ProjectBlockPath
} from "@/components/block-renderer";
import { TagList } from "@/components/tag-list";
import {
  getImageFileFromDataTransfer,
  readClipboardImageFile,
  uploadAdminImage
} from "@/lib/client-uploads";
import type {
  Note,
  Project,
  ProjectBlock,
  ProjectImage,
  StudioArchiveContent
} from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-600";
const textareaClass = `${inputClass} min-h-28 resize-y leading-6`;
const labelClass =
  "grid gap-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500";
const fieldTextClass = "normal-case tracking-normal text-neutral-900";
const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-950 bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200";
const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-950 dark:bg-neutral-950 dark:text-red-300 dark:hover:border-red-800";
const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-50";
const panelClass =
  "rounded-md border border-neutral-200 bg-white/95 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95 sm:p-4";
const editorPanelClass =
  "grid gap-5 rounded-md border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95 sm:gap-6 sm:p-5 lg:p-6";
const settingsPanelClass =
  `${editorPanelClass} lg:sticky lg:top-4 lg:max-h-[calc(var(--app-viewport-height)-2rem)] lg:overflow-y-auto lg:overscroll-contain`;
const previewPanelClass =
  "grid self-start gap-5 rounded-md border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/95 sm:p-5 lg:sticky lg:top-4 lg:max-h-[calc(var(--app-viewport-height)-2rem)] lg:overflow-y-auto lg:overscroll-contain";
const listClass =
  "grid max-h-72 gap-2 overflow-y-auto pr-1 sm:max-h-96 xl:max-h-[34vh]";

function projectBlockPathKey(path: ProjectBlockPath) {
  return path.join(".");
}

function scrollProjectBlockEditorIntoView(path: ProjectBlockPath) {
  const key = projectBlockPathKey(path);

  if (!key) {
    return;
  }

  window.requestAnimationFrame(() => {
    document.querySelector(`[data-project-block-editor="${key}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  });
}

function scrollProjectPreviewBlockIntoView(path: ProjectBlockPath) {
  const key = projectBlockPathKey(path);

  if (!key) {
    return;
  }

  window.requestAnimationFrame(() => {
    document.querySelector(`[data-project-block="${key}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  });
}

function isProjectEditorInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'a, button, input, select, textarea, [contenteditable="true"]'
      )
    )
  );
}

const blockLabels: Record<ProjectBlock["type"], string> = {
  heading: "제목",
  paragraph: "본문",
  image: "이미지",
  imageGrid: "갤러리",
  quote: "인용",
  button: "버튼",
  divider: "구분선",
  embed: "임베드",
  spacer: "여백",
  twoColumn: "2단 구성",
  stats: "지표",
  process: "과정",
  result: "결과"
};

const blockAddTypes: ProjectBlock["type"][] = [
  "heading",
  "paragraph",
  "image",
  "imageGrid",
  "button",
  "quote",
  "divider",
  "spacer",
  "embed",
  "twoColumn",
  "stats",
  "process",
  "result"
];

type ProjectInsertOption = {
  command: string;
  description: string;
  keywords: string[];
  label: string;
  type: ProjectBlock["type"];
  overrides?: Partial<ProjectBlock>;
};

const projectSlashCommandOptions: ProjectInsertOption[] = [
  {
    command: "/h2",
    description: "큰 제목 블록을 추가합니다.",
    keywords: ["heading", "title", "제목"],
    label: "제목 H2",
    type: "heading",
    overrides: { level: 2 } as Partial<ProjectBlock>
  },
  {
    command: "/h3",
    description: "작은 제목 블록을 추가합니다.",
    keywords: ["heading", "subtitle", "소제목"],
    label: "제목 H3",
    type: "heading",
    overrides: { level: 3 } as Partial<ProjectBlock>
  },
  {
    command: "/text",
    description: "본문 블록을 추가합니다.",
    keywords: ["paragraph", "body", "본문"],
    label: "본문",
    type: "paragraph"
  },
  {
    command: "/image",
    description: "이미지 블록을 추가합니다.",
    keywords: ["image", "photo", "이미지"],
    label: "이미지",
    type: "image"
  },
  {
    command: "/gallery",
    description: "이미지 갤러리를 추가합니다.",
    keywords: ["gallery", "grid", "갤러리"],
    label: "갤러리",
    type: "imageGrid"
  },
  {
    command: "/quote",
    description: "인용 블록을 추가합니다.",
    keywords: ["quote", "인용"],
    label: "인용",
    type: "quote"
  },
  {
    command: "/button",
    description: "버튼 블록을 추가합니다.",
    keywords: ["button", "link", "버튼"],
    label: "버튼",
    type: "button"
  },
  {
    command: "/divider",
    description: "구분선을 추가합니다.",
    keywords: ["divider", "line", "구분선"],
    label: "구분선",
    type: "divider"
  },
  {
    command: "/embed",
    description: "외부 콘텐츠 임베드를 추가합니다.",
    keywords: ["embed", "iframe", "임베드"],
    label: "임베드",
    type: "embed"
  },
  {
    command: "/spacer",
    description: "여백 블록을 추가합니다.",
    keywords: ["spacer", "space", "여백"],
    label: "여백",
    type: "spacer"
  },
  {
    command: "/columns",
    description: "2열 구성 블록을 추가합니다.",
    keywords: ["columns", "layout", "2열"],
    label: "2열 구성",
    type: "twoColumn"
  },
  {
    command: "/stats",
    description: "지표 블록을 추가합니다.",
    keywords: ["stats", "number", "지표"],
    label: "지표",
    type: "stats"
  },
  {
    command: "/process",
    description: "과정 블록을 추가합니다.",
    keywords: ["process", "step", "과정"],
    label: "과정",
    type: "process"
  },
  {
    command: "/result",
    description: "결과 블록을 추가합니다.",
    keywords: ["result", "outcome", "결과"],
    label: "결과",
    type: "result"
  }
];

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(value: string[]) {
  return value.join(", ");
}

function orderProjects(projects: Project[]) {
  return projects.map((project, index) => ({
    ...project,
    order: index
  }));
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || `project-${Date.now()}`;
}

function createProject(categories: string[]): Project {
  const timestamp = Date.now();

  return {
    slug: `project-${timestamp}`,
    title: "새 프로젝트",
    subtitle: "프로젝트의 한 줄 설명",
    year: new Date().getFullYear().toString(),
    period: "2026",
    role: "Design Direction",
    client: "Personal",
    category: categories[0] ?? "브랜딩",
    tags: ["케이스 스터디"],
    coverImage: "/images/placeholder-atlas.svg",
    description: "프로젝트 소개를 입력하세요.",
    tools: ["Figma"],
    deliverables: ["Visual System"],
    featured: false,
    blocks: [
      {
        type: "heading",
        text: "프로젝트 개요",
        level: 2
      },
      {
        type: "paragraph",
        text: "작업의 배경, 문제, 접근 방식을 간결하게 정리하세요."
      },
      {
        type: "image",
        src: "/images/placeholder-atlas-detail.svg",
        alt: "프로젝트 상세 이미지",
        caption: "이미지 설명을 입력하세요.",
        aspectRatio: "wide"
      }
    ]
  };
}

function createNote(): Note {
  return {
    slug: `note-${Date.now()}`,
    title: "새 노트",
    date: new Date().toISOString().slice(0, 10),
    category: "Process",
    tags: ["리서치"],
    excerpt: "작업 과정이나 레퍼런스 메모를 입력하세요."
  };
}

function createBlock(type: ProjectBlock["type"]): ProjectBlock {
  switch (type) {
    case "heading":
      return { type, text: "새 제목", level: 2 };
    case "paragraph":
      return { type, text: "본문을 입력하세요." };
    case "image":
      return {
        type,
        src: "/images/placeholder-atlas-detail.svg",
        alt: "프로젝트 이미지",
        caption: "",
        aspectRatio: "wide"
      };
    case "imageGrid":
      return {
        type,
        columns: 3,
        images: [
          {
            src: "/images/placeholder-atlas-grid-1.svg",
            alt: "그리드 이미지",
            caption: ""
          }
        ]
      };
    case "quote":
      return { type, quote: "핵심 문장을 입력하세요.", cite: "" };
    case "button":
      return { type, label: "자세히 보기", href: "/", variant: "primary" };
    case "divider":
      return { type, spacing: "md", style: "line" };
    case "embed":
      return {
        type,
        url: "https://www.youtube.com/embed/",
        provider: "YouTube",
        ratio: "wide"
      };
    case "spacer":
      return { type, height: 48 };
    case "twoColumn":
      return {
        type,
        left: [{ type: "heading", text: "왼쪽 제목", level: 3 }],
        right: [{ type: "paragraph", text: "오른쪽 내용을 입력하세요." }]
      };
    case "stats":
      return {
        type,
        items: [{ label: "지표", value: "0", description: "설명을 입력하세요." }]
      };
    case "process":
      return {
        type,
        steps: [{ title: "단계", description: "설명을 입력하세요." }]
      };
    case "result":
      return { type, title: "결과", items: ["성과를 입력하세요."] };
  }
}

function createProjectBlockFromOption(option: ProjectInsertOption) {
  return {
    ...createBlock(option.type),
    ...(option.overrides ?? {})
  } as ProjectBlock;
}

function replaceProjectBlockAtPath(
  blocks: ProjectBlock[],
  path: ProjectBlockPath,
  nextBlock: ProjectBlock
): ProjectBlock[] {
  const [blockIndex, side, ...childPath] = path;

  if (typeof blockIndex !== "number") {
    return blocks;
  }

  return blocks.map((block, currentIndex) => {
    if (currentIndex !== blockIndex) {
      return block;
    }

    if (path.length === 1) {
      return nextBlock;
    }

    if (block.type !== "twoColumn" || (side !== "left" && side !== "right")) {
      return block;
    }

    return {
      ...block,
      [side]: replaceProjectBlockAtPath(block[side], childPath, nextBlock)
    };
  });
}

function insertProjectBlockAfterPath(
  blocks: ProjectBlock[],
  path: ProjectBlockPath,
  nextBlock: ProjectBlock
): { blocks: ProjectBlock[]; path: ProjectBlockPath } {
  const [blockIndex, side, ...childPath] = path;

  if (typeof blockIndex !== "number") {
    return {
      blocks: [...blocks, nextBlock],
      path: [blocks.length]
    };
  }

  if (
    childPath.length > 0 &&
    (side === "left" || side === "right") &&
    blocks[blockIndex]?.type === "twoColumn"
  ) {
    const block = blocks[blockIndex];
    const inserted = insertProjectBlockAfterPath(block[side], childPath, nextBlock);

    return {
      blocks: blocks.map((currentBlock, currentIndex) =>
        currentIndex === blockIndex && currentBlock.type === "twoColumn"
          ? { ...currentBlock, [side]: inserted.blocks }
          : currentBlock
      ),
      path: [blockIndex, side, ...inserted.path]
    };
  }

  const insertIndex = Math.min(blockIndex + 1, blocks.length);
  const nextBlocks = [...blocks];
  nextBlocks.splice(insertIndex, 0, nextBlock);

  return {
    blocks: nextBlocks,
    path: [insertIndex]
  };
}

function insertProjectBlockAtPath(
  blocks: ProjectBlock[],
  path: ProjectBlockPath,
  nextBlock: ProjectBlock
): { blocks: ProjectBlock[]; path: ProjectBlockPath } {
  const [insertIndex, side, ...childPath] = path;

  if (typeof insertIndex !== "number") {
    return {
      blocks: [...blocks, nextBlock],
      path: [blocks.length]
    };
  }

  if (
    childPath.length > 0 &&
    (side === "left" || side === "right") &&
    blocks[insertIndex]?.type === "twoColumn"
  ) {
    const block = blocks[insertIndex];
    const inserted = insertProjectBlockAtPath(block[side], childPath, nextBlock);

    return {
      blocks: blocks.map((currentBlock, currentIndex) =>
        currentIndex === insertIndex && currentBlock.type === "twoColumn"
          ? { ...currentBlock, [side]: inserted.blocks }
          : currentBlock
      ),
      path: [insertIndex, side, ...inserted.path]
    };
  }

  const boundedIndex = Math.max(0, Math.min(insertIndex, blocks.length));
  const nextBlocks = [...blocks];
  nextBlocks.splice(boundedIndex, 0, nextBlock);

  return {
    blocks: nextBlocks,
    path: [boundedIndex]
  };
}

type ImageFieldsProps = {
  image: ProjectImage & { aspectRatio?: "wide" | "square" | "portrait" };
  showAspectRatio?: boolean;
  onChange: (
    image: ProjectImage & { aspectRatio?: "wide" | "square" | "portrait" }
  ) => void;
};

type UploadImageInputProps = {
  onUploaded: (url: string) => void;
};

type SortableProjectRowProps = {
  active: boolean;
  project: Project;
  onSelect: () => void;
};

function SortableProjectRow({
  active,
  project,
  onSelect
}: SortableProjectRowProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: project.slug });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      className={`grid grid-cols-[34px_1fr] overflow-hidden rounded-md border text-sm transition ${
        active
          ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600"
      } ${isDragging ? "opacity-60" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label={`${project.title} 순서 변경`}
        className={`flex h-full min-h-14 items-center justify-center border-r transition ${
          active
            ? "border-white/20 text-white/70 dark:border-neutral-950/20 dark:text-neutral-700"
            : "border-neutral-200 text-neutral-400 hover:text-neutral-800 dark:border-neutral-800 dark:hover:text-neutral-100"
        }`}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden size={15} />
      </button>
      <button
        className="min-w-0 px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-500"
        onClick={onSelect}
        type="button"
      >
        <span className="block truncate font-medium">{project.title}</span>
        <span className="mt-1 block truncate text-xs opacity-70">
          {project.category} · {project.year}
        </span>
      </button>
    </div>
  );
}

function UploadImageInput({ onUploaded }: UploadImageInputProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      });
      const body = (await response.json()) as {
        message?: string;
        url?: string;
      };

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok || !body.url) {
        throw new Error(body.message ?? "이미지를 업로드하지 못했습니다.");
      }

      onUploaded(body.url);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "이미지를 업로드하지 못했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClipboardUpload = async () => {
    try {
      const file = await readClipboardImageFile();

      if (!file) {
        window.alert("클립보드에 이미지가 없습니다.");
        return;
      }

      await handleUpload(file);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "클립보드 이미지를 불러오지 못했습니다."
      );
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <label className={`${secondaryButtonClass} w-fit cursor-pointer`}>
      {isUploading ? (
        <Loader2 aria-hidden className="animate-spin" size={15} />
      ) : (
        <Upload aria-hidden size={15} />
      )}
      이미지 업로드
      <input
        accept="image/*"
        className="sr-only"
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void handleUpload(file);
          }

          event.target.value = "";
        }}
        type="file"
      />
      </label>
      <button
        className={secondaryButtonClass}
        disabled={isUploading}
        onClick={() => void handleClipboardUpload()}
        type="button"
      >
        <Clipboard aria-hidden size={15} />
        클립보드 붙여넣기
      </button>
    </div>
  );
}

function ImageFields({
  image,
  showAspectRatio,
  onChange
}: ImageFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className={labelClass}>
        이미지 URL
            <input
              className={inputClass}
              onChange={(event) => onChange({ ...image, src: event.target.value })}
              onPaste={(event) => {
                const file = getImageFileFromDataTransfer(event.clipboardData);

                if (!file) {
                  return;
                }

                event.preventDefault();
                void (async () => {
                  try {
                    const url = await uploadAdminImage(file);

                    if (url) {
                      onChange({ ...image, src: url });
                    }
                  } catch (error) {
                    window.alert(
                      error instanceof Error
                        ? error.message
                        : "이미지를 업로드하지 못했습니다."
                    );
                  }
                })();
              }}
              value={image.src}
            />
      </label>
      <label className={labelClass}>
        대체 텍스트
        <input
          className={inputClass}
          onChange={(event) => onChange({ ...image, alt: event.target.value })}
          value={image.alt}
        />
      </label>
      <label className={labelClass}>
        캡션
        <input
          className={inputClass}
          onChange={(event) =>
            onChange({ ...image, caption: event.target.value })
          }
          value={image.caption ?? ""}
        />
      </label>
      {showAspectRatio ? (
        <label className={labelClass}>
          이미지 비율
          <select
            className={inputClass}
            onChange={(event) =>
              onChange({
                ...image,
                aspectRatio: event.target.value as "wide" | "square" | "portrait"
              })
            }
            value={image.aspectRatio ?? "wide"}
          >
            <option value="wide">가로형</option>
            <option value="square">정방형</option>
            <option value="portrait">세로형</option>
          </select>
        </label>
      ) : null}
      <div className="sm:col-span-2">
        <UploadImageInput
          onUploaded={(url) => onChange({ ...image, src: url })}
        />
      </div>
    </div>
  );
}

type BlockListEditorProps = {
  blocks: ProjectBlock[];
  nested?: boolean;
  onChange: (blocks: ProjectBlock[]) => void;
  onSelect?: (path: ProjectBlockPath) => void;
  pathPrefix?: ProjectBlockPath;
  selectedPath?: ProjectBlockPath;
};

function BlockListEditor({
  blocks,
  nested,
  onChange,
  onSelect,
  pathPrefix = [],
  selectedPath
}: BlockListEditorProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const selectedPathKey = selectedPath ? projectBlockPathKey(selectedPath) : "";

  const updateBlock = (index: number, block: ProjectBlock) => {
    onChange(blocks.map((item, itemIndex) => (itemIndex === index ? block : item)));
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= blocks.length) {
      return;
    }

    const nextBlocks = [...blocks];
    const [currentBlock] = nextBlocks.splice(index, 1);
    nextBlocks.splice(targetIndex, 0, currentBlock);
    onChange(nextBlocks);
  };

  const reorderBlock = (targetIndex: number) => {
    if (
      draggingIndex === null ||
      draggingIndex === targetIndex ||
      draggingIndex < 0 ||
      draggingIndex >= blocks.length
    ) {
      return;
    }

    onChange(arrayMove(blocks, draggingIndex, targetIndex));
    setDraggingIndex(null);
  };

  return (
    <div className={nested ? "grid gap-3" : "grid gap-4"}>
      {blocks.map((block, index) => {
        const currentPath: ProjectBlockPath = [...pathPrefix, index];
        const currentPathKey = projectBlockPathKey(currentPath);
        const active = selectedPathKey === currentPathKey;

        return (
          <section
            className={`rounded-md border bg-white p-3 transition dark:bg-neutral-950 sm:p-4 ${
              active
                ? "border-neutral-950 ring-2 ring-emerald-500/30 dark:border-neutral-50"
                : "border-neutral-200 dark:border-neutral-800"
            } ${draggingIndex === index ? "opacity-60" : ""}`}
            data-project-block-editor={currentPathKey}
            draggable
            key={`${block.type}-${index}`}
            onClick={(event) => {
              if (isProjectEditorInteractiveTarget(event.target)) {
                return;
              }

              onSelect?.(currentPath);
            }}
            onDragEnd={() => setDraggingIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDraggingIndex(index)}
            onDrop={(event) => {
              event.preventDefault();
              reorderBlock(index);
            }}
          >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                {blockLabels[block.type]}
              </p>
              <p className="text-xs text-neutral-500">블록 {index + 1}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="위로 이동"
                className={iconButtonClass}
                disabled={index === 0}
                onClick={() => moveBlock(index, -1)}
                type="button"
              >
                <ArrowUp aria-hidden size={15} />
              </button>
              <button
                aria-label="아래로 이동"
                className={iconButtonClass}
                disabled={index === blocks.length - 1}
                onClick={() => moveBlock(index, 1)}
                type="button"
              >
                <ArrowDown aria-hidden size={15} />
              </button>
              <button
                aria-label="블록 삭제"
                className={iconButtonClass}
                onClick={() => removeBlock(index)}
                type="button"
              >
                <Trash2 aria-hidden size={15} />
              </button>
            </div>
          </div>
          <BlockFields
            block={block}
            onChange={(nextBlock) => updateBlock(index, nextBlock)}
            onSelect={onSelect}
            path={currentPath}
            selectedPath={selectedPath}
          />
        </section>
        );
      })}
      <div className="flex flex-wrap gap-2">
        {blockAddTypes.map((type) => (
          <button
            className={secondaryButtonClass}
            key={type}
            onClick={() => onChange([...blocks, createBlock(type)])}
            type="button"
          >
            <Plus aria-hidden size={15} />
            {blockLabels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

type BlockFieldsProps = {
  block: ProjectBlock;
  onChange: (block: ProjectBlock) => void;
  onSelect?: (path: ProjectBlockPath) => void;
  path: ProjectBlockPath;
  selectedPath?: ProjectBlockPath;
};

function BlockFields({
  block,
  onChange,
  onSelect,
  path,
  selectedPath
}: BlockFieldsProps) {
  switch (block.type) {
    case "heading":
      return (
        <div className="grid gap-3 md:grid-cols-[140px_1fr]">
          <label className={labelClass}>
            단계
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, level: Number(event.target.value) as 2 | 3 })
              }
              value={block.level ?? 2}
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>
          <label className={labelClass}>
            제목
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, text: event.target.value })
              }
              value={block.text}
            />
          </label>
        </div>
      );
    case "paragraph":
      return (
        <div className="grid gap-3">
        <label className={labelClass}>
          본문
          <textarea
            className={textareaClass}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
            value={block.text}
          />
        </label>
        </div>
      );
    case "image":
      return (
        <ImageFields
          image={block}
          onChange={(image) => onChange({ ...block, ...image })}
          showAspectRatio
        />
      );
    case "imageGrid":
      return (
        <div className="grid gap-4">
          <label className={labelClass}>
            열 개수
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, columns: Number(event.target.value) as 2 | 3 })
              }
              value={block.columns ?? 3}
            >
              <option value={2}>2열</option>
              <option value={3}>3열</option>
            </select>
          </label>
          {block.images.map((image, imageIndex) => (
            <div
              className="grid gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              key={`${image.src}-${imageIndex}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  이미지 {imageIndex + 1}
                </p>
                <button
                  className={iconButtonClass}
                  onClick={() =>
                    onChange({
                      ...block,
                      images: block.images.filter(
                        (_, itemIndex) => itemIndex !== imageIndex
                      )
                    })
                  }
                  type="button"
                >
                  <Trash2 aria-hidden size={15} />
                </button>
              </div>
              <ImageFields
                image={image}
                onChange={(nextImage) =>
                  onChange({
                    ...block,
                    images: block.images.map((item, itemIndex) =>
                      itemIndex === imageIndex ? nextImage : item
                    )
                  })
                }
              />
            </div>
          ))}
          <button
            className={secondaryButtonClass}
            onClick={() =>
              onChange({
                ...block,
                images: [
                  ...block.images,
                  {
                    src: "/images/placeholder-atlas-grid-1.svg",
                    alt: "그리드 이미지",
                    caption: ""
                  }
                ]
              })
            }
            type="button"
          >
            <Plus aria-hidden size={15} />
            이미지 추가
          </button>
        </div>
      );
    case "quote":
      return (
        <div className="grid gap-3">
          <label className={labelClass}>
            인용문
            <textarea
              className={textareaClass}
              onChange={(event) =>
                onChange({ ...block, quote: event.target.value })
              }
              value={block.quote}
            />
          </label>
          <label className={labelClass}>
            출처
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, cite: event.target.value })
              }
              value={block.cite ?? ""}
            />
          </label>
        </div>
      );
    case "button":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            라벨
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, label: event.target.value })
              }
              value={block.label}
            />
          </label>
          <label className={labelClass}>
            링크
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, href: event.target.value })
              }
              value={block.href}
            />
          </label>
          <label className={labelClass}>
            형태
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  variant: event.target.value as
                    | "primary"
                    | "secondary"
                    | "text"
                })
              }
              value={block.variant ?? "primary"}
            >
              <option value="primary">채움</option>
              <option value="secondary">선</option>
              <option value="text">텍스트</option>
            </select>
          </label>
        </div>
      );
    case "divider":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <label className={labelClass}>
            간격
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  spacing: event.target.value as "sm" | "md" | "lg"
                })
              }
              value={block.spacing ?? "md"}
            >
              <option value="sm">작게</option>
              <option value="md">보통</option>
              <option value="lg">넓게</option>
            </select>
          </label>
          <label className={labelClass}>
            스타일
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  style: event.target.value as "line" | "dashed" | "blank"
                })
              }
              value={block.style ?? "line"}
            >
              <option value="line">실선</option>
              <option value="dashed">점선</option>
              <option value="blank">빈 여백</option>
            </select>
          </label>
        </div>
      );
    case "embed":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <label className={`${labelClass} md:col-span-2`}>
            임베드 URL
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, url: event.target.value })
              }
              placeholder="https://www.youtube.com/embed/..."
              value={block.url}
            />
          </label>
          <label className={labelClass}>
            제공처
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, provider: event.target.value })
              }
              value={block.provider ?? ""}
            />
          </label>
          <label className={labelClass}>
            비율
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  ratio: event.target.value as "wide" | "square"
                })
              }
              value={block.ratio ?? "wide"}
            >
              <option value="wide">가로형</option>
              <option value="square">정방형</option>
            </select>
          </label>
        </div>
      );
    case "spacer":
      return (
        <label className={labelClass}>
          높이
          <input
            className={inputClass}
            min={0}
            onChange={(event) =>
              onChange({ ...block, height: Number(event.target.value) })
            }
            type="number"
            value={block.height ?? 48}
          />
        </label>
      );
    case "twoColumn":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
              왼쪽
            </p>
            <BlockListEditor
              blocks={block.left}
              nested
              onChange={(left) => onChange({ ...block, left })}
              onSelect={onSelect}
              pathPrefix={[...path, "left"]}
              selectedPath={selectedPath}
            />
          </div>
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
              오른쪽
            </p>
            <BlockListEditor
              blocks={block.right}
              nested
              onChange={(right) => onChange({ ...block, right })}
              onSelect={onSelect}
              pathPrefix={[...path, "right"]}
              selectedPath={selectedPath}
            />
          </div>
        </div>
      );
    case "stats":
      return (
        <div className="grid gap-4">
          {block.items.map((item, itemIndex) => (
            <div
              className="grid gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800 md:grid-cols-[1fr_1fr_2fr_auto]"
              key={`${item.label}-${itemIndex}`}
            >
              <label className={labelClass}>
                라벨
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      items: block.items.map((currentItem, currentIndex) =>
                        currentIndex === itemIndex
                          ? { ...currentItem, label: event.target.value }
                          : currentItem
                      )
                    })
                  }
                  value={item.label}
                />
              </label>
              <label className={labelClass}>
                값
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      items: block.items.map((currentItem, currentIndex) =>
                        currentIndex === itemIndex
                          ? { ...currentItem, value: event.target.value }
                          : currentItem
                      )
                    })
                  }
                  value={item.value}
                />
              </label>
              <label className={labelClass}>
                설명
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      items: block.items.map((currentItem, currentIndex) =>
                        currentIndex === itemIndex
                          ? { ...currentItem, description: event.target.value }
                          : currentItem
                      )
                    })
                  }
                  value={item.description ?? ""}
                />
              </label>
              <button
                className={`${iconButtonClass} self-end`}
                onClick={() =>
                  onChange({
                    ...block,
                    items: block.items.filter(
                      (_, currentIndex) => currentIndex !== itemIndex
                    )
                  })
                }
                type="button"
              >
                <Trash2 aria-hidden size={15} />
              </button>
            </div>
          ))}
          <button
            className={secondaryButtonClass}
            onClick={() =>
              onChange({
                ...block,
                items: [
                  ...block.items,
                  { label: "지표", value: "0", description: "설명" }
                ]
              })
            }
            type="button"
          >
            <Plus aria-hidden size={15} />
            지표 추가
          </button>
        </div>
      );
    case "process":
      return (
        <div className="grid gap-4">
          {block.steps.map((step, stepIndex) => (
            <div
              className="grid gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
              key={`${step.title}-${stepIndex}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  단계 {stepIndex + 1}
                </p>
                <button
                  className={iconButtonClass}
                  onClick={() =>
                    onChange({
                      ...block,
                      steps: block.steps.filter(
                        (_, currentIndex) => currentIndex !== stepIndex
                      )
                    })
                  }
                  type="button"
                >
                  <Trash2 aria-hidden size={15} />
                </button>
              </div>
              <label className={labelClass}>
                제목
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      steps: block.steps.map((currentStep, currentIndex) =>
                        currentIndex === stepIndex
                          ? { ...currentStep, title: event.target.value }
                          : currentStep
                      )
                    })
                  }
                  value={step.title}
                />
              </label>
              <label className={labelClass}>
                설명
                <textarea
                  className={textareaClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      steps: block.steps.map((currentStep, currentIndex) =>
                        currentIndex === stepIndex
                          ? { ...currentStep, description: event.target.value }
                          : currentStep
                      )
                    })
                  }
                  value={step.description}
                />
              </label>
            </div>
          ))}
          <button
            className={secondaryButtonClass}
            onClick={() =>
              onChange({
                ...block,
                steps: [
                  ...block.steps,
                  { title: "단계", description: "설명을 입력하세요." }
                ]
              })
            }
            type="button"
          >
            <Plus aria-hidden size={15} />
            단계 추가
          </button>
        </div>
      );
    case "result":
      return (
        <div className="grid gap-3">
          <label className={labelClass}>
            제목
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({ ...block, title: event.target.value })
              }
              value={block.title}
            />
          </label>
          <label className={labelClass}>
            결과 목록
            <textarea
              className={textareaClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  items: event.target.value
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean)
                })
              }
              value={block.items.join("\n")}
            />
          </label>
        </div>
      );
  }
}

type AdminLivePreviewProps = {
  activePanel: "projects" | "notes";
  note?: Note;
  project?: Project;
  selectedProjectBlockPath?: ProjectBlockPath;
  onSelectProjectBlock?: (path: ProjectBlockPath) => void;
  onChangeProject?: (project: Project) => void;
  onChangeProjectBlock?: (path: ProjectBlockPath, block: ProjectBlock) => void;
  onInsertProjectBlock?: (
    path: ProjectBlockPath,
    type: ProjectBlock["type"]
  ) => void;
};

function PreviewMetaItem({
  label,
  value,
  onChange
}: {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  if (!value && !onChange) {
    return null;
  }

  return (
    <div className="grid gap-1 border-t border-neutral-200 py-3 dark:border-neutral-800">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-neutral-800 dark:text-neutral-200">
        {onChange ? (
          <InlineEditableText
            as="span"
            onChange={onChange}
            placeholder={label}
            value={value ?? ""}
          />
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function ProjectLivePreview({
  project,
  selectedBlockPath,
  onSelectBlock,
  onChangeProject,
  onChangeBlock,
  onInsertBlock
}: {
  project: Project;
  selectedBlockPath?: ProjectBlockPath;
  onSelectBlock?: (path: ProjectBlockPath) => void;
  onChangeProject?: (project: Project) => void;
  onChangeBlock?: (path: ProjectBlockPath, block: ProjectBlock) => void;
  onInsertBlock?: (path: ProjectBlockPath, type: ProjectBlock["type"]) => void;
}) {
  const coverImage = project.coverImage || "/images/placeholder-atlas.svg";
  const editable = Boolean(
    onChangeProject || onChangeBlock || onSelectBlock || onInsertBlock
  );
  const updateProject = (projectPatch: Partial<Project>) => {
    onChangeProject?.({ ...project, ...projectPatch });
  };

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          실시간 미리보기
        </p>
        <h2 className="mt-2 text-xl font-semibold text-neutral-950 dark:text-neutral-50">
          프로젝트 공개 화면
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          저장 전 변경도 이 화면에 바로 반영됩니다.
        </p>
      </div>

      <article className="grid gap-4 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div className="aspect-[4/3] overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
          <Image
            alt={project.title || "프로젝트 커버 이미지"}
            className="h-full w-full object-cover"
            height={720}
            sizes="(min-width: 1280px) 360px, 100vw"
            src={coverImage}
            unoptimized
            width={960}
          />
        </div>
        <div
          className={`grid gap-3 ${
            editable ? "[&_.project-preview-readonly]:hidden" : ""
          }`}
        >
          {editable ? (
            <div className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <InlineEditableText
                    as="p"
                    className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300"
                    onChange={(category) => updateProject({ category })}
                    placeholder="카테고리"
                    value={project.category}
                  />
                  <InlineEditableText
                    as="h3"
                    className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50"
                    onChange={(title) => updateProject({ title })}
                    placeholder="프로젝트 제목"
                    value={project.title}
                  />
                </div>
                <InlineEditableText
                  as="span"
                  className="text-sm text-neutral-500 dark:text-neutral-500"
                  onChange={(year) => updateProject({ year })}
                  placeholder="연도"
                  value={project.year}
                />
              </div>
              <InlineEditableText
                as="p"
                className="text-sm leading-7 text-neutral-600 dark:text-neutral-400"
                multiline
                onChange={(subtitle) => updateProject({ subtitle })}
                placeholder="짧은 소개"
                value={project.subtitle}
              />
            </div>
          ) : null}
          <div className="project-preview-readonly flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                {project.category || "카테고리"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                {project.title || "프로젝트 제목"}
              </h3>
            </div>
            <span className="text-sm text-neutral-500 dark:text-neutral-500">
              {project.year}
            </span>
          </div>
          <p className="project-preview-readonly text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            {project.subtitle}
          </p>
          <TagList compact tags={project.tags.slice(0, 4)} />
        </div>
      </article>

      <section className="grid gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
            상세 페이지
          </p>
          <h3 className="mt-2 text-lg font-semibold text-neutral-950 dark:text-neutral-50">
            프로젝트 정보
          </h3>
        </div>
        {editable ? (
          <dl className="grid gap-0">
            <PreviewMetaItem
              label="역할"
              onChange={(role) => updateProject({ role })}
              value={project.role}
            />
            <PreviewMetaItem
              label="기간"
              onChange={(period) => updateProject({ period })}
              value={project.period}
            />
            <PreviewMetaItem
              label="클라이언트"
              onChange={(client) => updateProject({ client })}
              value={project.client}
            />
            <PreviewMetaItem
              label="툴"
              onChange={(tools) => updateProject({ tools: textToList(tools) })}
              value={project.tools.join(", ")}
            />
            <PreviewMetaItem
              label="결과물"
              onChange={(deliverables) =>
                updateProject({ deliverables: textToList(deliverables) })
              }
              value={project.deliverables.join(", ")}
            />
          </dl>
        ) : null}
        <dl className={editable ? "hidden" : "grid gap-0"}>
          <PreviewMetaItem label="역할" value={project.role} />
          <PreviewMetaItem label="기간" value={project.period} />
          <PreviewMetaItem label="클라이언트" value={project.client} />
          <PreviewMetaItem label="도구" value={project.tools.join(", ")} />
          <PreviewMetaItem
            label="결과물"
            value={project.deliverables.join(", ")}
          />
        </dl>
        {editable ? (
          <InlineEditableText
            as="p"
            className="whitespace-pre-line text-sm leading-7 text-neutral-600 dark:text-neutral-400"
            multiline
            onChange={(description) => updateProject({ description })}
            placeholder="프로젝트 설명"
            value={project.description}
          />
        ) : project.description ? (
          <p className="whitespace-pre-line text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            {project.description}
          </p>
        ) : null}
        <div className="border-t border-neutral-200 pt-1 dark:border-neutral-800 [&_blockquote]:my-6 [&_blockquote]:text-lg [&_h2]:mt-8 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:text-xl [&_p]:text-sm [&_p]:leading-7">
          <BlockRenderer
            blocks={project.blocks}
            editable={editable}
            onChangeBlock={onChangeBlock}
            onInsertBlock={onInsertBlock}
            onSelectBlock={onSelectBlock}
            selectedBlockPath={selectedBlockPath}
          />
        </div>
      </section>
    </div>
  );
}

type ProjectCommandBarProps = {
  commandMatches: ProjectInsertOption[];
  commandValue: string;
  isAddMenuOpen: boolean;
  isCommandOpen: boolean;
  selectedCommandIndex: number;
  onCommandFocus: () => void;
  onCommandKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onCommandValueChange: (value: string) => void;
  onInsert: (option: ProjectInsertOption) => void;
  onToggleAddMenu: () => void;
};

function ProjectCommandBar({
  commandMatches,
  commandValue,
  isAddMenuOpen,
  isCommandOpen,
  selectedCommandIndex,
  onCommandFocus,
  onCommandKeyDown,
  onCommandValueChange,
  onInsert,
  onToggleAddMenu
}: ProjectCommandBarProps) {
  return (
    <div className="ipad-project-command-bar pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="pointer-events-auto relative flex w-full max-w-xl items-center gap-2 rounded-md border border-neutral-200 bg-white/95 p-2 shadow-2xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        {(isCommandOpen || isAddMenuOpen) ? (
          <div className="absolute bottom-[calc(100%+8px)] left-0 grid max-h-80 w-full gap-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
            {isCommandOpen ? (
              commandMatches.length > 0 ? (
                commandMatches.map((option, index) => {
                  const active = index === selectedCommandIndex;

                  return (
                    <button
                      className={`grid gap-1 rounded-sm px-3 py-2 text-left text-sm transition ${
                        active
                          ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                      }`}
                      key={option.command}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onInsert(option)}
                      type="button"
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs opacity-70">
                        {option.command} · {option.description}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-2 text-sm text-neutral-500">
                  맞는 명령어가 없습니다.
                </p>
              )
            ) : (
              <div className="grid gap-3">
                <div>
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    기본 블록
                  </p>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {projectSlashCommandOptions.map((option) => (
                      <button
                        className="rounded-sm border border-neutral-200 px-3 py-2 text-left text-sm text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600"
                        key={option.command}
                        onClick={() => onInsert(option)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <button
          aria-expanded={isAddMenuOpen}
          aria-label="블록 추가 메뉴"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600"
          onClick={onToggleAddMenu}
          type="button"
        >
          <Plus aria-hidden size={18} />
        </button>
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-transparent bg-neutral-100 px-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:bg-neutral-900 dark:text-neutral-50 dark:focus:border-neutral-700 dark:focus:bg-neutral-950"
          onChange={(event) => onCommandValueChange(event.target.value)}
          onFocus={onCommandFocus}
          onKeyDown={onCommandKeyDown}
          placeholder="/ 입력으로 블록 추가"
          value={commandValue}
        />
      </div>
    </div>
  );
}

function NoteLivePreview({ note }: { note: Note }) {
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          실시간 미리보기
        </p>
        <h2 className="mt-2 text-xl font-semibold text-neutral-950 dark:text-neutral-50">
          아카이브 공개 화면
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          노트 목록에 보일 제목, 분류, 요약을 바로 확인합니다.
        </p>
      </div>

      <article className="grid gap-4 border-y border-neutral-200 py-5 dark:border-neutral-800">
        <div className="grid gap-1">
          <time
            className="text-sm text-neutral-500 dark:text-neutral-500"
            dateTime={note.date}
          >
            {note.date}
          </time>
          <span className="text-xs uppercase tracking-[0.16em] text-neutral-400">
            {note.category || "분류"}
          </span>
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
            {note.title || "노트 제목"}
          </h3>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-600 dark:text-neutral-400">
            {note.excerpt}
          </p>
        </div>
        <TagList compact tags={note.tags} />
      </article>
    </div>
  );
}

function AdminLivePreview({
  activePanel,
  note,
  project,
  selectedProjectBlockPath,
  onSelectProjectBlock,
  onChangeProject,
  onChangeProjectBlock,
  onInsertProjectBlock
}: AdminLivePreviewProps) {
  if (activePanel === "projects" && project) {
    return (
      <ProjectLivePreview
        onChangeBlock={onChangeProjectBlock}
        onChangeProject={onChangeProject}
        onInsertBlock={onInsertProjectBlock}
        onSelectBlock={onSelectProjectBlock}
        project={project}
        selectedBlockPath={selectedProjectBlockPath}
      />
    );
  }

  if (activePanel === "notes" && note) {
    return <NoteLivePreview note={note} />;
  }

  return (
    <div className="grid min-h-64 place-items-center rounded-md border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
          미리볼 항목을 선택해주세요.
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          왼쪽 목록에서 프로젝트나 아카이브 노트를 고르면 공개 화면을 바로 볼 수
          있습니다.
        </p>
      </div>
    </div>
  );
}

type AdminEditorProps = {
  authEnabled: boolean;
  storageMode: "database" | "file";
  mode?: "all" | "projects" | "notes";
};

const editorCopy = {
  all: {
    eyebrow: "Admin",
    title: "Studio Archive 편집",
    description:
      "프로젝트, 카테고리, 아카이브 노트를 수정합니다. DB 저장, 로그인 보호, 이미지 업로드를 운영 환경에 연결할 수 있습니다."
  },
  projects: {
    eyebrow: "Projects",
    title: "프로젝트 편집",
    description:
      "프로젝트 카드와 상세 페이지에 쓰이는 제목, 이미지, 카테고리, 태그, 본문 블록을 관리합니다."
  },
  notes: {
    eyebrow: "Archive",
    title: "아카이브 편집",
    description:
      "아카이브 페이지에 노출되는 작업 기록, 리서치 메모, 레퍼런스 노트를 관리합니다."
  }
} satisfies Record<
  NonNullable<AdminEditorProps["mode"]>,
  { eyebrow: string; title: string; description: string }
>;

export function AdminEditor({
  authEnabled,
  storageMode,
  mode = "all"
}: AdminEditorProps) {
  const [content, setContent] = useState<StudioArchiveContent | null>(null);
  const [selectedProjectSlug, setSelectedProjectSlug] = useState("");
  const [selectedProjectBlockPath, setSelectedProjectBlockPath] =
    useState<ProjectBlockPath>([]);
  const [projectCommandValue, setProjectCommandValue] = useState("");
  const [isProjectCommandOpen, setIsProjectCommandOpen] = useState(false);
  const [isProjectAddMenuOpen, setIsProjectAddMenuOpen] = useState(false);
  const [selectedProjectCommandIndex, setSelectedProjectCommandIndex] =
    useState(0);
  const [selectedNoteSlug, setSelectedNoteSlug] = useState("");
  const [activePanel, setActivePanel] = useState<"projects" | "notes">(
    mode === "notes" ? "notes" : "projects"
  );
  const [newCategory, setNewCategory] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const copy = editorCopy[mode];
  const isProjectBuilderMode = mode === "projects";
  const showProjects = mode !== "notes";
  const showNotes = mode !== "projects";
  const showCategories = showProjects;
  const editorLayoutClass =
    mode === "all"
      ? "grid items-start gap-4 xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]"
      : "grid items-start gap-4 lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(280px,320px)] xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(300px,360px)] 2xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(360px,460px)]";

  useEffect(() => {
    let mounted = true;

    async function loadContent() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/content", {
          cache: "no-store"
        });

        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        if (!response.ok) {
          throw new Error("콘텐츠를 불러오지 못했습니다.");
        }

        const nextContent = (await response.json()) as StudioArchiveContent;

        if (!mounted) {
          return;
        }

        setContent(nextContent);
        setSelectedProjectSlug(nextContent.projects[0]?.slug ?? "");
        setSelectedNoteSlug(nextContent.notes[0]?.slug ?? "");
        setStatus("콘텐츠를 불러왔습니다.");
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : "콘텐츠를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadContent();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedProject = useMemo(
    () =>
      content?.projects.find((project) => project.slug === selectedProjectSlug),
    [content, selectedProjectSlug]
  );
  const selectedNote = useMemo(
    () => content?.notes.find((note) => note.slug === selectedNoteSlug),
    [content, selectedNoteSlug]
  );
  const projectCommandQuery = projectCommandValue.trimStart().startsWith("/")
    ? projectCommandValue.trimStart().slice(1).trim().toLowerCase()
    : "";
  const projectCommandMatches = useMemo(() => {
    if (!projectCommandValue.trimStart().startsWith("/")) {
      return [];
    }

    if (!projectCommandQuery) {
      return projectSlashCommandOptions;
    }

    return projectSlashCommandOptions.filter((option) => {
      const haystack = [
        option.command,
        option.description,
        option.label,
        ...option.keywords
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(projectCommandQuery);
    });
  }, [projectCommandQuery, projectCommandValue]);

  useEffect(() => {
    if (
      !isProjectBuilderMode ||
      activePanel !== "projects" ||
      selectedProjectBlockPath.length === 0
    ) {
      return;
    }

    scrollProjectBlockEditorIntoView(selectedProjectBlockPath);
  }, [
    activePanel,
    isProjectBuilderMode,
    selectedProjectBlockPath,
    selectedProjectSlug
  ]);

  const updateContent = (
    updater: (currentContent: StudioArchiveContent) => StudioArchiveContent
  ) => {
    setContent((currentContent) =>
      currentContent ? updater(currentContent) : currentContent
    );
  };

  const updateSelectedProject = (project: Project) => {
    const currentSlug = selectedProjectSlug;

    updateContent((currentContent) => ({
      ...currentContent,
      projects: currentContent.projects.map((currentProject) =>
        currentProject.slug === currentSlug ? project : currentProject
      )
    }));
    setSelectedProjectSlug(project.slug);
  };

  const updateSelectedProjectBlock = (
    path: ProjectBlockPath,
    block: ProjectBlock
  ) => {
    if (!selectedProject) {
      return;
    }

    setSelectedProjectBlockPath((currentPath) =>
      projectBlockPathKey(currentPath) === projectBlockPathKey(path)
        ? currentPath
        : path
    );
    updateSelectedProject({
      ...selectedProject,
      blocks: replaceProjectBlockAtPath(selectedProject.blocks, path, block)
    });
  };

  const insertProjectBlockOption = (option: ProjectInsertOption) => {
    if (!selectedProject) {
      return;
    }

    const nextBlock = createProjectBlockFromOption(option);
    const insertion = insertProjectBlockAfterPath(
      selectedProject.blocks,
      selectedProjectBlockPath,
      nextBlock
    );

    updateSelectedProject({
      ...selectedProject,
      blocks: insertion.blocks
    });
    setSelectedProjectBlockPath(insertion.path);
    setProjectCommandValue("");
    setIsProjectCommandOpen(false);
    setIsProjectAddMenuOpen(false);
    setSelectedProjectCommandIndex(0);
    setStatus(`${option.label} 블록을 추가했습니다.`);
  };

  const insertProjectBlockAtPreviewPath = (
    path: ProjectBlockPath,
    type: ProjectBlock["type"]
  ) => {
    if (!selectedProject) {
      return;
    }

    const nextBlock = createBlock(type);
    const insertion = insertProjectBlockAtPath(
      selectedProject.blocks,
      path,
      nextBlock
    );

    updateSelectedProject({
      ...selectedProject,
      blocks: insertion.blocks
    });
    setSelectedProjectBlockPath(insertion.path);
    setStatus(`${blockLabels[type]} 블록을 추가했습니다.`);
  };

  const selectProjectBlockFromSettings = (path: ProjectBlockPath) => {
    setSelectedProjectBlockPath(path);
    scrollProjectPreviewBlockIntoView(path);
  };

  const handleProjectCommandValueChange = (value: string) => {
    setProjectCommandValue(value);
    setSelectedProjectCommandIndex(0);

    if (value.trimStart().startsWith("/")) {
      setIsProjectCommandOpen(true);
      return;
    }

    setIsProjectCommandOpen(false);
  };

  const handleProjectCommandKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Escape") {
      setIsProjectCommandOpen(false);
      setIsProjectAddMenuOpen(false);
      return;
    }

    if (!isProjectCommandOpen || projectCommandMatches.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedProjectCommandIndex((currentIndex) =>
        currentIndex >= projectCommandMatches.length - 1 ? 0 : currentIndex + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedProjectCommandIndex((currentIndex) =>
        currentIndex <= 0 ? projectCommandMatches.length - 1 : currentIndex - 1
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      insertProjectBlockOption(
        projectCommandMatches[
          Math.min(selectedProjectCommandIndex, projectCommandMatches.length - 1)
        ]
      );
    }
  };

  const updateSelectedNote = (note: Note) => {
    const currentSlug = selectedNoteSlug;

    updateContent((currentContent) => ({
      ...currentContent,
      notes: currentContent.notes.map((currentNote) =>
        currentNote.slug === currentSlug ? note : currentNote
      )
    }));
    setSelectedNoteSlug(note.slug);
  };

  const handleProjectDragEnd = (event: DragEndEvent) => {
    if (!content || !event.over || event.active.id === event.over.id) {
      return;
    }

    const oldIndex = content.projects.findIndex(
      (project) => project.slug === event.active.id
    );
    const newIndex = content.projects.findIndex(
      (project) => project.slug === event.over?.id
    );

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    updateContent((currentContent) => ({
      ...currentContent,
      projects: orderProjects(
        arrayMove(currentContent.projects, oldIndex, newIndex)
      )
    }));
    setStatus("프로젝트 순서를 변경했습니다. 저장하면 공개 목록에도 반영됩니다.");
  };

  const reloadContent = async () => {
    setIsLoading(true);
    setStatus("다시 불러오는 중입니다.");

    const response = await fetch("/api/admin/content", { cache: "no-store" });

    if (response.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const nextContent = (await response.json()) as StudioArchiveContent;
    setContent(nextContent);
    setSelectedProjectSlug(nextContent.projects[0]?.slug ?? "");
    setSelectedProjectBlockPath([]);
    setSelectedNoteSlug(nextContent.notes[0]?.slug ?? "");
    setStatus("최신 콘텐츠를 불러왔습니다.");
    setIsLoading(false);
  };

  const saveContent = async () => {
    if (!content) {
      return;
    }

    try {
      setIsSaving(true);
      setStatus("저장하는 중입니다.");

      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(content)
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        throw new Error("저장하지 못했습니다.");
      }

      const savedContent = (await response.json()) as StudioArchiveContent;
      setContent(savedContent);
      setStatus("저장되었습니다. 공개 페이지에 바로 반영됩니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST"
    });
    window.location.href = "/admin/login";
  };

  if (isLoading && !content) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="inline-flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
          <Loader2 aria-hidden className="animate-spin" size={18} />
          콘텐츠를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-200">
        {status || "콘텐츠를 불러오지 못했습니다."}
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 sm:gap-5">
      <header className="grid gap-5 rounded-md border border-neutral-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 sm:p-5 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-neutral-950 dark:text-neutral-50 sm:text-4xl lg:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
            {copy.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-sm border border-neutral-200 px-2 py-1 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
              저장소: {storageMode === "database" ? "Postgres DB" : "파일"}
            </span>
            <span className="rounded-sm border border-neutral-200 px-2 py-1 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
              로그인: {authEnabled ? "사용 중" : "환경변수 필요"}
            </span>
          </div>
          <nav className="mt-5 grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap">
            <Link
              className={`w-full sm:w-auto ${
                mode === "all" ? primaryButtonClass : secondaryButtonClass
              }`}
              href="/admin"
            >
              전체 관리
            </Link>
            <Link
              className={`${secondaryButtonClass} w-full sm:w-auto`}
              href="/admin/editor"
            >
              홈 빌더
            </Link>
            <Link
              className={`w-full sm:w-auto ${
                mode === "projects" ? primaryButtonClass : secondaryButtonClass
              }`}
              href="/admin/projects"
            >
              프로젝트
            </Link>
            <Link
              className={`w-full sm:w-auto ${
                mode === "notes" ? primaryButtonClass : secondaryButtonClass
              }`}
              href="/admin/archive"
            >
              아카이브
            </Link>
            <Link
              className={`${secondaryButtonClass} w-full sm:w-auto`}
              href="/admin/accounts"
            >
              계정 승인
            </Link>
          </nav>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
          {authEnabled ? (
            <button
              className={`${secondaryButtonClass} w-full sm:w-auto`}
              onClick={() => void logout()}
              type="button"
            >
              <LogOut aria-hidden size={16} />
              로그아웃
            </button>
          ) : null}
          <button
            className={`${secondaryButtonClass} w-full sm:w-auto`}
            onClick={() => void reloadContent()}
            type="button"
          >
            <RefreshCw aria-hidden size={16} />
            다시 불러오기
          </button>
          <button
            className={`${primaryButtonClass} col-span-2 w-full sm:col-span-1 sm:w-auto`}
            disabled={isSaving}
            onClick={() => void saveContent()}
            type="button"
          >
            {isSaving ? (
              <Loader2 aria-hidden className="animate-spin" size={16} />
            ) : (
              <Save aria-hidden size={16} />
            )}
            저장하기
          </button>
        </div>
      </header>

      {status ? (
        <p className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          {status}
        </p>
      ) : null}

      <div className={editorLayoutClass}>
        <aside className="grid gap-4 self-start lg:sticky lg:top-4 lg:max-h-[calc(var(--app-viewport-height)-2rem)] lg:overflow-y-auto lg:pr-1 lg:overscroll-contain">
          {showCategories ? (
            <section className={panelClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                카테고리
              </h2>
            </div>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:max-h-80">
              {content.categories.map((category, index) => (
                <div className="flex gap-2" key={`${category}-${index}`}>
                  <input
                    className={inputClass}
                    onChange={(event) => {
                      const previousCategory = category;
                      const nextCategory = event.target.value;

                      updateContent((currentContent) => ({
                        ...currentContent,
                        categories: currentContent.categories.map(
                          (currentCategory, currentIndex) =>
                            currentIndex === index
                              ? nextCategory
                              : currentCategory
                        ),
                        projects: currentContent.projects.map((project) =>
                          project.category === previousCategory
                            ? { ...project, category: nextCategory }
                            : project
                        )
                      }));
                    }}
                    value={category}
                  />
                  <button
                    aria-label="카테고리 삭제"
                    className={iconButtonClass}
                    onClick={() => {
                      const nextCategories = content.categories.filter(
                        (_, currentIndex) => currentIndex !== index
                      );
                      const fallbackCategory = nextCategories[0] ?? "";

                      updateContent((currentContent) => ({
                        ...currentContent,
                        categories: nextCategories,
                        projects: currentContent.projects.map((project) =>
                          project.category === category
                            ? { ...project, category: fallbackCategory }
                            : project
                        )
                      }));
                    }}
                    type="button"
                  >
                    <Trash2 aria-hidden size={15} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <input
                  className={inputClass}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="새 카테고리"
                  value={newCategory}
                />
                <button
                  className={iconButtonClass}
                  onClick={() => {
                    const category = newCategory.trim();

                    if (!category || content.categories.includes(category)) {
                      return;
                    }

                    updateContent((currentContent) => ({
                      ...currentContent,
                      categories: [...currentContent.categories, category]
                    }));
                    setNewCategory("");
                  }}
                  type="button"
                >
                  <Plus aria-hidden size={15} />
                </button>
              </div>
            </div>
            </section>
          ) : null}

          {showProjects ? (
            <section className={panelClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                프로젝트
              </h2>
              <button
                className={iconButtonClass}
                onClick={() => {
                  const project = createProject(content.categories);

                  updateContent((currentContent) => ({
                    ...currentContent,
                    projects: orderProjects([project, ...currentContent.projects])
                  }));
                  setSelectedProjectSlug(project.slug);
                  setSelectedProjectBlockPath([]);
                  setActivePanel("projects");
                }}
                type="button"
              >
                <Plus aria-hidden size={15} />
              </button>
            </div>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleProjectDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={content.projects.map((project) => project.slug)}
                strategy={verticalListSortingStrategy}
              >
                <div className={listClass}>
                  {content.projects.map((project) => (
                    <SortableProjectRow
                      active={
                        activePanel === "projects" &&
                        selectedProjectSlug === project.slug
                      }
                      key={project.slug}
                      onSelect={() => {
                        setSelectedProjectSlug(project.slug);
                        setSelectedProjectBlockPath([]);
                        setActivePanel("projects");
                      }}
                      project={project}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            </section>
          ) : null}

          {showNotes ? (
            <section className={panelClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                아카이브 노트
              </h2>
              <button
                className={iconButtonClass}
                onClick={() => {
                  const note = createNote();

                  updateContent((currentContent) => ({
                    ...currentContent,
                    notes: [note, ...currentContent.notes]
                  }));
                  setSelectedNoteSlug(note.slug);
                  setActivePanel("notes");
                }}
                type="button"
              >
                <Plus aria-hidden size={15} />
              </button>
            </div>
            <div className={listClass}>
              {content.notes.map((note) => {
                const active =
                  activePanel === "notes" && selectedNoteSlug === note.slug;

                return (
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                      active
                        ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
                        : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600"
                    }`}
                    key={note.slug}
                    onClick={() => {
                      setSelectedNoteSlug(note.slug);
                      setActivePanel("notes");
                    }}
                    type="button"
                  >
                    <span className="block font-medium">{note.title}</span>
                    <span className="mt-1 block text-xs opacity-70">
                      {note.date} · {note.category}
                    </span>
                  </button>
                );
              })}
            </div>
            </section>
          ) : null}
        </aside>

        {isProjectBuilderMode ? (
          <section className="min-w-0 lg:order-2" aria-label="실시간 미리보기">
            <div className={previewPanelClass}>
              <AdminLivePreview
                activePanel={activePanel}
                note={selectedNote}
                onChangeProject={updateSelectedProject}
                onChangeProjectBlock={updateSelectedProjectBlock}
                onInsertProjectBlock={insertProjectBlockAtPreviewPath}
                onSelectProjectBlock={setSelectedProjectBlockPath}
                project={selectedProject}
                selectedProjectBlockPath={selectedProjectBlockPath}
              />
            </div>
          </section>
        ) : null}

        <div className={isProjectBuilderMode ? "min-w-0 lg:order-3" : "min-w-0"}>
          {activePanel === "projects" && selectedProject ? (
            <section
              className={
                isProjectBuilderMode ? settingsPanelClass : editorPanelClass
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                    프로젝트 편집
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                    {selectedProject.title}
                  </h2>
                </div>
                <button
                  className={`${dangerButtonClass} w-full sm:w-auto`}
                  onClick={() => {
                    if (!window.confirm("이 프로젝트를 삭제할까요?")) {
                      return;
                    }

                    updateContent((currentContent) => {
                      const projects = orderProjects(
                        currentContent.projects.filter(
                          (project) => project.slug !== selectedProject.slug
                        )
                      );

                      setSelectedProjectSlug(projects[0]?.slug ?? "");
                      setSelectedProjectBlockPath([]);

                      return {
                        ...currentContent,
                        projects
                      };
                    });
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden size={16} />
                  삭제
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  제목
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        title: event.target.value
                      })
                    }
                    value={selectedProject.title}
                  />
                </label>
                <label className={labelClass}>
                  Slug
                  <input
                    className={inputClass}
                    onBlur={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        slug: slugify(event.target.value)
                      })
                    }
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        slug: event.target.value
                      })
                    }
                    value={selectedProject.slug}
                  />
                </label>
                <label className={labelClass}>
                  부제
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        subtitle: event.target.value
                      })
                    }
                    value={selectedProject.subtitle}
                  />
                </label>
                <label className={labelClass}>
                  연도
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        year: event.target.value
                      })
                    }
                    value={selectedProject.year}
                  />
                </label>
                <label className={labelClass}>
                  역할
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        role: event.target.value
                      })
                    }
                    value={selectedProject.role}
                  />
                </label>
                <label className={labelClass}>
                  기간
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        period: event.target.value
                      })
                    }
                    value={selectedProject.period}
                  />
                </label>
                <label className={labelClass}>
                  클라이언트
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        client: event.target.value
                      })
                    }
                    value={selectedProject.client}
                  />
                </label>
                <label className={labelClass}>
                  카테고리
                  <select
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        category: event.target.value
                      })
                    }
                    value={selectedProject.category}
                  >
                    {content.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  커버 이미지 URL
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        coverImage: event.target.value
                      })
                    }
                    onPaste={(event) => {
                      const file = getImageFileFromDataTransfer(event.clipboardData);

                      if (!file) {
                        return;
                      }

                      event.preventDefault();
                      void (async () => {
                        try {
                          const url = await uploadAdminImage(file);

                          if (url) {
                            updateSelectedProject({
                              ...selectedProject,
                              coverImage: url
                            });
                          }
                        } catch (error) {
                          window.alert(
                            error instanceof Error
                              ? error.message
                              : "이미지를 업로드하지 못했습니다."
                          );
                        }
                      })();
                    }}
                    value={selectedProject.coverImage}
                  />
                  <UploadImageInput
                    onUploaded={(url) =>
                      updateSelectedProject({
                        ...selectedProject,
                        coverImage: url
                      })
                    }
                  />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  소개
                  <textarea
                    className={textareaClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        description: event.target.value
                      })
                    }
                    value={selectedProject.description}
                  />
                </label>
                <label className={labelClass}>
                  태그
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        tags: textToList(event.target.value)
                      })
                    }
                    value={listToText(selectedProject.tags)}
                  />
                  <span className={fieldTextClass}>쉼표로 구분합니다.</span>
                </label>
                <label className={labelClass}>
                  도구
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        tools: textToList(event.target.value)
                      })
                    }
                    value={listToText(selectedProject.tools)}
                  />
                  <span className={fieldTextClass}>쉼표로 구분합니다.</span>
                </label>
                <label className={labelClass}>
                  결과물
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        deliverables: textToList(event.target.value)
                      })
                    }
                    value={listToText(selectedProject.deliverables)}
                  />
                  <span className={fieldTextClass}>쉼표로 구분합니다.</span>
                </label>
                <label className="flex items-center gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-800 dark:border-neutral-800 dark:text-neutral-200">
                  <input
                    checked={Boolean(selectedProject.featured)}
                    className="h-4 w-4 accent-emerald-600"
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        featured: event.target.checked
                      })
                    }
                    type="checkbox"
                  />
                  홈 대표 작업으로 표시
                </label>
              </div>

              <div className="grid gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                    블록
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-neutral-950 dark:text-neutral-50">
                    상세 페이지 구성
                  </h3>
                </div>
                <BlockListEditor
                  blocks={selectedProject.blocks}
                  onChange={(blocks) =>
                    updateSelectedProject({ ...selectedProject, blocks })
                  }
                  onSelect={selectProjectBlockFromSettings}
                  selectedPath={selectedProjectBlockPath}
                />
              </div>
            </section>
          ) : null}

          {activePanel === "notes" && selectedNote ? (
            <section className={editorPanelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                    노트 편집
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                    {selectedNote.title}
                  </h2>
                </div>
                <button
                  className={`${dangerButtonClass} w-full sm:w-auto`}
                  onClick={() => {
                    if (!window.confirm("이 노트를 삭제할까요?")) {
                      return;
                    }

                    updateContent((currentContent) => {
                      const notes = currentContent.notes.filter(
                        (note) => note.slug !== selectedNote.slug
                      );

                      setSelectedNoteSlug(notes[0]?.slug ?? "");

                      return {
                        ...currentContent,
                        notes
                      };
                    });
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden size={16} />
                  삭제
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  제목
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedNote({
                        ...selectedNote,
                        title: event.target.value
                      })
                    }
                    value={selectedNote.title}
                  />
                </label>
                <label className={labelClass}>
                  Slug
                  <input
                    className={inputClass}
                    onBlur={(event) =>
                      updateSelectedNote({
                        ...selectedNote,
                        slug: slugify(event.target.value)
                      })
                    }
                    onChange={(event) =>
                      updateSelectedNote({
                        ...selectedNote,
                        slug: event.target.value
                      })
                    }
                    value={selectedNote.slug}
                  />
                </label>
                <label className={labelClass}>
                  날짜
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedNote({
                        ...selectedNote,
                        date: event.target.value
                      })
                    }
                    type="date"
                    value={selectedNote.date}
                  />
                </label>
                <label className={labelClass}>
                  분류
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedNote({
                        ...selectedNote,
                        category: event.target.value
                      })
                    }
                    value={selectedNote.category}
                  />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  태그
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedNote({
                        ...selectedNote,
                        tags: textToList(event.target.value)
                      })
                    }
                    value={listToText(selectedNote.tags)}
                  />
                </label>
                <label className={`${labelClass} sm:col-span-2`}>
                  내용
                  <textarea
                    className={textareaClass}
                    onChange={(event) =>
                      updateSelectedNote({
                        ...selectedNote,
                        excerpt: event.target.value
                      })
                    }
                    value={selectedNote.excerpt}
                  />
                </label>
              </div>
            </section>
          ) : null}
        </div>

        {mode !== "all" && !isProjectBuilderMode ? (
          <aside className={previewPanelClass}>
            <AdminLivePreview
              activePanel={activePanel}
              note={selectedNote}
              onChangeProject={updateSelectedProject}
              onChangeProjectBlock={updateSelectedProjectBlock}
              onInsertProjectBlock={insertProjectBlockAtPreviewPath}
              onSelectProjectBlock={setSelectedProjectBlockPath}
              project={selectedProject}
              selectedProjectBlockPath={selectedProjectBlockPath}
            />
          </aside>
        ) : null}
      </div>

      {isProjectBuilderMode && selectedProject ? (
        <ProjectCommandBar
          commandMatches={projectCommandMatches}
          commandValue={projectCommandValue}
          isAddMenuOpen={isProjectAddMenuOpen}
          isCommandOpen={isProjectCommandOpen}
          onCommandFocus={() => {
            if (projectCommandValue.trimStart().startsWith("/")) {
              setIsProjectCommandOpen(true);
            }
          }}
          onCommandKeyDown={handleProjectCommandKeyDown}
          onCommandValueChange={handleProjectCommandValueChange}
          onInsert={insertProjectBlockOption}
          onToggleAddMenu={() => {
            setIsProjectAddMenuOpen((current) => !current);
            setIsProjectCommandOpen(false);
          }}
          selectedCommandIndex={selectedProjectCommandIndex}
        />
      ) : null}
    </div>
  );
}
