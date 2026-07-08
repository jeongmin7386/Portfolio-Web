"use client";

import {
  ArrowDown,
  ArrowUp,
  LogOut,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const blockLabels: Record<ProjectBlock["type"], string> = {
  heading: "제목",
  paragraph: "본문",
  image: "이미지",
  imageGrid: "이미지 그리드",
  quote: "인용",
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
  "quote",
  "twoColumn",
  "stats",
  "process",
  "result"
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

  return (
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
  );
}

function ImageFields({
  image,
  showAspectRatio,
  onChange
}: ImageFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className={labelClass}>
        이미지 URL
        <input
          className={inputClass}
          onChange={(event) => onChange({ ...image, src: event.target.value })}
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
      <div className="md:col-span-2">
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
};

function BlockListEditor({ blocks, nested, onChange }: BlockListEditorProps) {
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

  return (
    <div className={nested ? "grid gap-3" : "grid gap-4"}>
      {blocks.map((block, index) => (
        <section
          className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          key={`${block.type}-${index}`}
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
          />
        </section>
      ))}
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
};

function BlockFields({ block, onChange }: BlockFieldsProps) {
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
        <label className={labelClass}>
          본문
          <textarea
            className={textareaClass}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
            value={block.text}
          />
        </label>
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

type AdminEditorProps = {
  authEnabled: boolean;
  storageMode: "database" | "file";
};

export function AdminEditor({ authEnabled, storageMode }: AdminEditorProps) {
  const [content, setContent] = useState<StudioArchiveContent | null>(null);
  const [selectedProjectSlug, setSelectedProjectSlug] = useState("");
  const [selectedNoteSlug, setSelectedNoteSlug] = useState("");
  const [activePanel, setActivePanel] = useState<"projects" | "notes">(
    "projects"
  );
  const [newCategory, setNewCategory] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="grid gap-8">
      <header className="grid gap-5 border-b border-neutral-200 pb-8 dark:border-neutral-800 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Admin
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-neutral-950 dark:text-neutral-50 md:text-6xl">
            Studio Archive 편집
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
            프로젝트, 카테고리, 아카이브 노트를 수정합니다. DB 저장,
            로그인 보호, 이미지 업로드를 운영 환경에 연결할 수 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-sm border border-neutral-200 px-2 py-1 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
              저장소: {storageMode === "database" ? "Postgres DB" : "파일"}
            </span>
            <span className="rounded-sm border border-neutral-200 px-2 py-1 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
              로그인: {authEnabled ? "사용 중" : "환경변수 필요"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {authEnabled ? (
            <button
              className={secondaryButtonClass}
              onClick={() => void logout()}
              type="button"
            >
              <LogOut aria-hidden size={16} />
              로그아웃
            </button>
          ) : null}
          <button
            className={secondaryButtonClass}
            onClick={() => void reloadContent()}
            type="button"
          >
            <RefreshCw aria-hidden size={16} />
            다시 불러오기
          </button>
          <button
            className={primaryButtonClass}
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

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="grid gap-6 self-start">
          <section className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                카테고리
              </h2>
            </div>
            <div className="grid gap-2">
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

          <section className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
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
                    projects: [project, ...currentContent.projects]
                  }));
                  setSelectedProjectSlug(project.slug);
                  setActivePanel("projects");
                }}
                type="button"
              >
                <Plus aria-hidden size={15} />
              </button>
            </div>
            <div className="grid gap-2">
              {content.projects.map((project) => {
                const active =
                  activePanel === "projects" &&
                  selectedProjectSlug === project.slug;

                return (
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                      active
                        ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
                        : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600"
                    }`}
                    key={project.slug}
                    onClick={() => {
                      setSelectedProjectSlug(project.slug);
                      setActivePanel("projects");
                    }}
                    type="button"
                  >
                    <span className="block font-medium">{project.title}</span>
                    <span className="mt-1 block text-xs opacity-70">
                      {project.category} · {project.year}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
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
            <div className="grid gap-2">
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
        </aside>

        <main className="min-w-0">
          {activePanel === "projects" && selectedProject ? (
            <section className="grid gap-6 rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
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
                  className={dangerButtonClass}
                  onClick={() => {
                    if (!window.confirm("이 프로젝트를 삭제할까요?")) {
                      return;
                    }

                    updateContent((currentContent) => {
                      const projects = currentContent.projects.filter(
                        (project) => project.slug !== selectedProject.slug
                      );

                      setSelectedProjectSlug(projects[0]?.slug ?? "");

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

              <div className="grid gap-4 md:grid-cols-2">
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
                <label className={`${labelClass} md:col-span-2`}>
                  커버 이미지 URL
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      updateSelectedProject({
                        ...selectedProject,
                        coverImage: event.target.value
                      })
                    }
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
                <label className={`${labelClass} md:col-span-2`}>
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
                />
              </div>
            </section>
          ) : null}

          {activePanel === "notes" && selectedNote ? (
            <section className="grid gap-6 rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
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
                  className={dangerButtonClass}
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
              <div className="grid gap-4 md:grid-cols-2">
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
                <label className={`${labelClass} md:col-span-2`}>
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
                <label className={`${labelClass} md:col-span-2`}>
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
        </main>
      </div>
    </div>
  );
}
