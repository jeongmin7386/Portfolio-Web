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
import {
  Copy,
  Eye,
  GripVertical,
  Loader2,
  Monitor,
  PanelRight,
  Plus,
  Save,
  Send,
  Smartphone,
  Tablet,
  Trash2,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderPage,
  BuilderSection,
  BuilderSectionSettings,
  BuilderSectionType,
  BuilderViewport,
  Note,
  Project,
  StudioArchiveContent
} from "@/lib/types";

type PageBuilderEditorProps = {
  authEnabled: boolean;
};

type SortableRowProps = {
  id: string;
  active?: boolean;
  children: React.ReactNode;
};

const sectionLabels: Record<BuilderSectionType, string> = {
  hero: "Hero",
  projectGrid: "Project Grid",
  imageGallery: "Image Gallery",
  textSection: "Text Section",
  twoColumn: "Two Column",
  quote: "Quote",
  button: "Button",
  divider: "Divider",
  embed: "Embed",
  contact: "Contact",
  archiveList: "Archive List"
};

const blockLabels: Record<BuilderBlockType, string> = {
  heading: "제목",
  paragraph: "본문",
  image: "이미지",
  gallery: "갤러리",
  button: "버튼",
  divider: "구분선",
  embed: "임베드",
  spacer: "여백",
  quote: "인용",
  stats: "지표"
};

const sectionTypes: BuilderSectionType[] = [
  "hero",
  "projectGrid",
  "imageGallery",
  "textSection",
  "twoColumn",
  "quote",
  "button",
  "divider",
  "embed",
  "contact",
  "archiveList"
];

const blockTypes: BuilderBlockType[] = [
  "heading",
  "paragraph",
  "image",
  "gallery",
  "button",
  "divider",
  "embed",
  "spacer",
  "quote",
  "stats"
];

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-600";
const textareaClass = `${inputClass} min-h-24 resize-y leading-6`;
const labelClass =
  "grid gap-2 text-xs font-medium uppercase tracking-[0.14em] text-neutral-500";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:text-neutral-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-950 bg-neutral-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200";
const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:border-red-300 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-red-950 dark:bg-neutral-950 dark:text-red-300 dark:hover:border-red-800";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function orderItems<T extends { order: number }>(items: T[]) {
  return items.map((item, index) => ({ ...item, order: index }));
}

function createBlock(type: BuilderBlockType): BuilderBlock {
  const id = createId("block");

  switch (type) {
    case "heading":
      return {
        id,
        type,
        order: 0,
        content: { text: "새 제목" },
        settings: { level: 2, align: "left" }
      };
    case "paragraph":
      return {
        id,
        type,
        order: 0,
        content: { text: "본문을 입력하세요." },
        settings: { width: "content", align: "left" }
      };
    case "image":
      return {
        id,
        type,
        order: 0,
        content: {
          src: "/images/placeholder-atlas.svg",
          alt: "이미지",
          caption: ""
        },
        settings: { ratio: "wide", borderRadius: "md" }
      };
    case "gallery":
      return {
        id,
        type,
        order: 0,
        content: {
          images: [
            {
              src: "/images/placeholder-atlas-grid-1.svg",
              alt: "갤러리 이미지",
              caption: ""
            }
          ]
        },
        settings: { columns: 3, gap: "md" }
      };
    case "button":
      return {
        id,
        type,
        order: 0,
        content: { label: "버튼", href: "/" },
        settings: { variant: "primary", align: "left" }
      };
    case "divider":
      return {
        id,
        type,
        order: 0,
        content: {},
        settings: { spacing: "md", style: "line" }
      };
    case "embed":
      return {
        id,
        type,
        order: 0,
        content: { url: "https://www.youtube.com/embed/", provider: "YouTube" },
        settings: { ratio: "wide" }
      };
    case "spacer":
      return {
        id,
        type,
        order: 0,
        content: {},
        settings: { height: 48 }
      };
    case "quote":
      return {
        id,
        type,
        order: 0,
        content: { text: "인용문을 입력하세요.", author: "" },
        settings: { align: "left" }
      };
    case "stats":
      return {
        id,
        type,
        order: 0,
        content: { label: "지표", value: "0" },
        settings: { align: "left" }
      };
  }
}

function createSection(type: BuilderSectionType): BuilderSection {
  const id = createId("section");
  const baseSettings: BuilderSectionSettings = {
    paddingY: "lg",
    marginY: "none",
    maxWidth: "wide",
    align: "left",
    gap: "md",
    backgroundColor: "transparent",
    textColor: ""
  };

  switch (type) {
    case "hero":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, paddingY: "xl" },
        blocks: orderItems([
          createBlock("heading"),
          createBlock("paragraph"),
          createBlock("button")
        ])
      };
    case "projectGrid":
      return {
        id,
        type,
        order: 0,
        settings: {
          ...baseSettings,
          columns: 3,
          cardStyle: "none",
          gridStyle: "cards",
          projectSource: "featured",
          projectLimit: 6
        },
        blocks: orderItems([createBlock("heading"), createBlock("paragraph")])
      };
    case "imageGallery":
      return {
        id,
        type,
        order: 0,
        settings: baseSettings,
        blocks: orderItems([createBlock("heading"), createBlock("gallery")])
      };
    case "textSection":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, maxWidth: "content" },
        blocks: orderItems([createBlock("heading"), createBlock("paragraph")])
      };
    case "twoColumn":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, columns: 2 },
        blocks: orderItems([createBlock("heading"), createBlock("paragraph")])
      };
    case "quote":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, maxWidth: "content" },
        blocks: orderItems([createBlock("quote")])
      };
    case "button":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, maxWidth: "content" },
        blocks: orderItems([createBlock("button")])
      };
    case "divider":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, paddingY: "sm" },
        blocks: orderItems([createBlock("divider")])
      };
    case "embed":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, maxWidth: "content" },
        blocks: orderItems([createBlock("embed")])
      };
    case "contact":
      return {
        id,
        type,
        order: 0,
        settings: { ...baseSettings, maxWidth: "content" },
        blocks: orderItems([
          createBlock("heading"),
          createBlock("paragraph"),
          createBlock("button")
        ])
      };
    case "archiveList":
      return {
        id,
        type,
        order: 0,
        settings: baseSettings,
        blocks: orderItems([createBlock("heading")])
      };
  }
}

function cloneSection(section: BuilderSection) {
  return {
    ...section,
    id: createId("section"),
    blocks: section.blocks.map((block) => ({
      ...block,
      id: createId("block")
    }))
  };
}

function SortableRow({ id, active, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-md border bg-white p-2 text-sm transition dark:bg-neutral-950 ${
        active
          ? "border-neutral-950 dark:border-neutral-50"
          : "border-neutral-200 dark:border-neutral-800"
      } ${isDragging ? "opacity-60" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <button
        aria-label="순서 변경"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden size={16} />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function getViewportClass(viewport: BuilderViewport) {
  switch (viewport) {
    case "mobile":
      return "max-w-[390px]";
    case "tablet":
      return "max-w-[820px]";
    case "desktop":
      return "max-w-none";
  }
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData
  });
  const body = (await response.json()) as { message?: string; url?: string };

  if (response.status === 401) {
    window.location.href = "/admin/login";
    return undefined;
  }

  if (!response.ok || !body.url) {
    throw new Error(body.message ?? "이미지를 업로드하지 못했습니다.");
  }

  return body.url;
}

export function PageBuilderEditor({ authEnabled }: PageBuilderEditorProps) {
  const [page, setPage] = useState<BuilderPage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [viewport, setViewport] = useState<BuilderViewport>("desktop");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    let mounted = true;

    async function loadEditor() {
      try {
        setIsLoading(true);
        const [pageResponse, contentResponse] = await Promise.all([
          fetch("/api/admin/page", { cache: "no-store" }),
          fetch("/api/admin/content", { cache: "no-store" })
        ]);

        if (pageResponse.status === 401 || contentResponse.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        if (!pageResponse.ok || !contentResponse.ok) {
          throw new Error("편집 데이터를 불러오지 못했습니다.");
        }

        const nextPage = (await pageResponse.json()) as BuilderPage;
        const content = (await contentResponse.json()) as StudioArchiveContent;

        if (!mounted) {
          return;
        }

        setPage(nextPage);
        setProjects(content.projects);
        setNotes(content.notes);
        setSelectedSectionId(nextPage.sections[0]?.id ?? "");
        setSelectedBlockId("");
        setStatus("편집 데이터를 불러왔습니다.");
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : "편집 데이터를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEditor();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedSections = useMemo(
    () => page?.sections.slice().sort((a, b) => a.order - b.order) ?? [],
    [page]
  );
  const selectedSection = sortedSections.find(
    (section) => section.id === selectedSectionId
  );
  const selectedBlock = selectedSection?.blocks.find(
    (block) => block.id === selectedBlockId
  );

  const updatePage = (updater: (currentPage: BuilderPage) => BuilderPage) => {
    setPage((currentPage) => (currentPage ? updater(currentPage) : currentPage));
  };

  const updateSelectedSection = (section: BuilderSection) => {
    updatePage((currentPage) => ({
      ...currentPage,
      sections: orderItems(
        currentPage.sections.map((currentSection) =>
          currentSection.id === section.id ? section : currentSection
        )
      )
    }));
  };

  const updateSelectedBlock = (block: BuilderBlock) => {
    if (!selectedSection) {
      return;
    }

    updateSelectedSection({
      ...selectedSection,
      blocks: orderItems(
        selectedSection.blocks.map((currentBlock) =>
          currentBlock.id === block.id ? block : currentBlock
        )
      )
    });
  };

  const addSection = (type: BuilderSectionType) => {
    if (!page) {
      return;
    }

    const section = createSection(type);
    const sections = orderItems([...sortedSections, section]);

    setPage({ ...page, sections });
    setSelectedSectionId(section.id);
    setSelectedBlockId("");
  };

  const deleteSelectedSection = () => {
    if (!page || !selectedSection) {
      return;
    }

    const sections = orderItems(
      page.sections.filter((section) => section.id !== selectedSection.id)
    );
    setPage({ ...page, sections });
    setSelectedSectionId(sections[0]?.id ?? "");
    setSelectedBlockId("");
  };

  const duplicateSelectedSection = () => {
    if (!page || !selectedSection) {
      return;
    }

    const index = sortedSections.findIndex(
      (section) => section.id === selectedSection.id
    );
    const nextSections = [...sortedSections];
    const copiedSection = cloneSection(selectedSection);
    nextSections.splice(index + 1, 0, copiedSection);
    setPage({ ...page, sections: orderItems(nextSections) });
    setSelectedSectionId(copiedSection.id);
    setSelectedBlockId("");
  };

  const addBlock = (type: BuilderBlockType) => {
    if (!selectedSection) {
      return;
    }

    const block = createBlock(type);
    updateSelectedSection({
      ...selectedSection,
      blocks: orderItems([...selectedSection.blocks, block])
    });
    setSelectedBlockId(block.id);
  };

  const deleteSelectedBlock = () => {
    if (!selectedSection || !selectedBlock) {
      return;
    }

    const blocks = orderItems(
      selectedSection.blocks.filter((block) => block.id !== selectedBlock.id)
    );
    updateSelectedSection({ ...selectedSection, blocks });
    setSelectedBlockId(blocks[0]?.id ?? "");
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    if (!page || !event.over || event.active.id === event.over.id) {
      return;
    }

    const oldIndex = sortedSections.findIndex(
      (section) => section.id === event.active.id
    );
    const newIndex = sortedSections.findIndex(
      (section) => section.id === event.over?.id
    );

    setPage({
      ...page,
      sections: orderItems(arrayMove(sortedSections, oldIndex, newIndex))
    });
  };

  const handleBlockDragEnd = (event: DragEndEvent) => {
    if (!selectedSection || !event.over || event.active.id === event.over.id) {
      return;
    }

    const blocks = selectedSection.blocks.slice().sort((a, b) => a.order - b.order);
    const oldIndex = blocks.findIndex((block) => block.id === event.active.id);
    const newIndex = blocks.findIndex((block) => block.id === event.over?.id);
    updateSelectedSection({
      ...selectedSection,
      blocks: orderItems(arrayMove(blocks, oldIndex, newIndex))
    });
  };

  const savePage = async (nextPage = page) => {
    if (!nextPage) {
      return;
    }

    try {
      setIsSaving(true);
      setStatus("저장하는 중입니다.");

      const response = await fetch("/api/admin/page", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nextPage)
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "페이지를 저장하지 못했습니다.");
      }

      const savedPage = (await response.json()) as BuilderPage;
      setPage(savedPage);
      setStatus("저장되었습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "페이지를 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const publishPage = async () => {
    if (!page) {
      return;
    }

    await savePage({ ...page, status: "published" });
    setStatus("게시되었습니다. 공개 페이지에 반영됩니다.");
  };

  const handleImageUpload = async (onUploaded: (url: string) => void, file?: File) => {
    if (!file) {
      return;
    }

    try {
      const url = await uploadImage(file);

      if (url) {
        onUploaded(url);
      }
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "이미지를 업로드하지 못했습니다."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="inline-flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
          <Loader2 aria-hidden className="animate-spin" size={18} />
          편집기를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-950 dark:bg-red-950/20 dark:text-red-200">
          {status || "편집기를 불러오지 못했습니다."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="flex items-center gap-3">
          <PanelRight aria-hidden size={18} />
          <div>
            <h1 className="text-sm font-semibold">페이지 빌더</h1>
            <p className="text-xs text-neutral-500">
              {authEnabled ? "관리자 로그인 사용 중" : "로그인 환경변수 필요"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["desktop", "tablet", "mobile"] as BuilderViewport[]).map((item) => {
            const Icon =
              item === "desktop" ? Monitor : item === "tablet" ? Tablet : Smartphone;
            const active = viewport === item;

            return (
              <button
                aria-pressed={active}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition ${
                  active
                    ? "border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                }`}
                key={item}
                onClick={() => setViewport(item)}
                type="button"
              >
                <Icon aria-hidden size={17} />
              </button>
            );
          })}
          <button
            className={buttonClass}
            onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
            type="button"
          >
            <Eye aria-hidden size={16} />
            미리보기
          </button>
          <button
            className={buttonClass}
            disabled={isSaving}
            onClick={() => void savePage()}
            type="button"
          >
            {isSaving ? (
              <Loader2 aria-hidden className="animate-spin" size={16} />
            ) : (
              <Save aria-hidden size={16} />
            )}
            저장
          </button>
          <button
            className={primaryButtonClass}
            disabled={isSaving}
            onClick={() => void publishPage()}
            type="button"
          >
            <Send aria-hidden size={16} />
            게시
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[280px_1fr_340px]">
        <aside className="border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="grid gap-6">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                섹션 추가
              </h2>
              <div className="mt-3 grid gap-2">
                {sectionTypes.map((type) => (
                  <button
                    className={buttonClass}
                    key={type}
                    onClick={() => addSection(type)}
                    type="button"
                  >
                    <Plus aria-hidden size={15} />
                    {sectionLabels[type]}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                섹션 순서
              </h2>
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleSectionDragEnd}
                sensors={sensors}
              >
                <SortableContext
                  items={sortedSections.map((section) => section.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mt-3 grid gap-2">
                    {sortedSections.map((section) => (
                      <SortableRow
                        active={selectedSectionId === section.id}
                        id={section.id}
                        key={section.id}
                      >
                        <button
                          className="block w-full truncate text-left"
                          onClick={() => {
                            setSelectedSectionId(section.id);
                            setSelectedBlockId("");
                          }}
                          type="button"
                        >
                          {sectionLabels[section.type]}
                        </button>
                      </SortableRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          </div>
        </aside>

        <main className="overflow-auto bg-neutral-100 p-4 dark:bg-neutral-900">
          {status ? (
            <p className="mb-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              {status}
            </p>
          ) : null}
          <div
            className={`mx-auto min-h-[720px] overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm transition-all dark:border-neutral-800 dark:bg-neutral-950 ${getViewportClass(
              viewport
            )}`}
          >
            <BuilderPageRenderer
              editable
              notes={notes}
              onSelectBlock={(sectionId, blockId) => {
                setSelectedSectionId(sectionId);
                setSelectedBlockId(blockId);
              }}
              onSelectSection={(sectionId) => {
                setSelectedSectionId(sectionId);
                setSelectedBlockId("");
              }}
              page={page}
              projects={projects}
              selectedBlockId={selectedBlockId}
              selectedSectionId={selectedSectionId}
            />
          </div>
        </main>

        <aside className="border-l border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="grid gap-6">
            <section className="grid gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                페이지
              </h2>
              <label className={labelClass}>
                제목
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setPage({ ...page, title: event.target.value })
                  }
                  value={page.title}
                />
              </label>
              <label className={labelClass}>
                SEO 제목
                <input
                  className={inputClass}
                  onChange={(event) =>
                    setPage({ ...page, seoTitle: event.target.value })
                  }
                  value={page.seoTitle}
                />
              </label>
              <label className={labelClass}>
                SEO 설명
                <textarea
                  className={textareaClass}
                  onChange={(event) =>
                    setPage({ ...page, seoDescription: event.target.value })
                  }
                  value={page.seoDescription}
                />
              </label>
            </section>

            {selectedSection ? (
              <SectionInspector
                categories={Array.from(
                  new Set(projects.map((project) => project.category))
                )}
                onChange={updateSelectedSection}
                onDelete={deleteSelectedSection}
                onDuplicate={duplicateSelectedSection}
                section={selectedSection}
              />
            ) : null}

            {selectedSection ? (
              <section className="grid gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    블록
                  </h2>
                  {selectedBlock ? (
                    <button
                      className={dangerButtonClass}
                      onClick={deleteSelectedBlock}
                      type="button"
                    >
                      <Trash2 aria-hidden size={15} />
                      삭제
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {blockTypes.map((type) => (
                    <button
                      className={buttonClass}
                      key={type}
                      onClick={() => addBlock(type)}
                      type="button"
                    >
                      <Plus aria-hidden size={15} />
                      {blockLabels[type]}
                    </button>
                  ))}
                </div>
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleBlockDragEnd}
                  sensors={sensors}
                >
                  <SortableContext
                    items={selectedSection.blocks.map((block) => block.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-2">
                      {selectedSection.blocks
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .map((block) => (
                          <SortableRow
                            active={selectedBlockId === block.id}
                            id={block.id}
                            key={block.id}
                          >
                            <button
                              className="block w-full truncate text-left"
                              onClick={() => setSelectedBlockId(block.id)}
                              type="button"
                            >
                              {blockLabels[block.type]}
                            </button>
                          </SortableRow>
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>
            ) : null}

            {selectedBlock ? (
              <BlockInspector
                block={selectedBlock}
                onChange={updateSelectedBlock}
                onImageUpload={handleImageUpload}
              />
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

type SectionInspectorProps = {
  section: BuilderSection;
  categories: string[];
  onChange: (section: BuilderSection) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

function SectionInspector({
  section,
  categories,
  onChange,
  onDelete,
  onDuplicate
}: SectionInspectorProps) {
  const updateSettings = (settings: Partial<BuilderSectionSettings>) => {
    onChange({
      ...section,
      settings: {
        ...section.settings,
        ...settings
      }
    });
  };

  return (
    <section className="grid gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            섹션 설정
          </h2>
          <p className="mt-1 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {sectionLabels[section.type]}
          </p>
        </div>
        <div className="flex gap-2">
          <button className={buttonClass} onClick={onDuplicate} type="button">
            <Copy aria-hidden size={15} />
          </button>
          <button className={dangerButtonClass} onClick={onDelete} type="button">
            <Trash2 aria-hidden size={15} />
          </button>
        </div>
      </div>
      <label className={labelClass}>
        상하 여백
        <select
          className={inputClass}
          onChange={(event) =>
            updateSettings({
              paddingY: event.target.value as BuilderSectionSettings["paddingY"]
            })
          }
          value={section.settings.paddingY ?? "lg"}
        >
          <option value="none">없음</option>
          <option value="sm">작게</option>
          <option value="md">보통</option>
          <option value="lg">넓게</option>
          <option value="xl">아주 넓게</option>
        </select>
      </label>
      <label className={labelClass}>
        최대 너비
        <select
          className={inputClass}
          onChange={(event) =>
            updateSettings({
              maxWidth: event.target.value as BuilderSectionSettings["maxWidth"]
            })
          }
          value={section.settings.maxWidth ?? "wide"}
        >
          <option value="narrow">좁게</option>
          <option value="content">기본</option>
          <option value="wide">넓게</option>
          <option value="full">전체</option>
        </select>
      </label>
      <label className={labelClass}>
        정렬
        <select
          className={inputClass}
          onChange={(event) =>
            updateSettings({
              align: event.target.value as BuilderSectionSettings["align"]
            })
          }
          value={section.settings.align ?? "left"}
        >
          <option value="left">왼쪽</option>
          <option value="center">가운데</option>
          <option value="right">오른쪽</option>
        </select>
      </label>
      <label className={labelClass}>
        배경색
        <input
          className={inputClass}
          onChange={(event) =>
            updateSettings({ backgroundColor: event.target.value })
          }
          placeholder="transparent 또는 #f8fafc"
          value={section.settings.backgroundColor ?? ""}
        />
      </label>
      <label className={labelClass}>
        글자색
        <input
          className={inputClass}
          onChange={(event) => updateSettings({ textColor: event.target.value })}
          placeholder="#111827"
          value={section.settings.textColor ?? ""}
        />
      </label>
      <label className={labelClass}>
        간격
        <select
          className={inputClass}
          onChange={(event) =>
            updateSettings({
              gap: event.target.value as BuilderSectionSettings["gap"]
            })
          }
          value={section.settings.gap ?? "md"}
        >
          <option value="none">없음</option>
          <option value="sm">작게</option>
          <option value="md">보통</option>
          <option value="lg">넓게</option>
        </select>
      </label>
      {section.type === "projectGrid" ? (
        <>
          <label className={labelClass}>
            프로젝트 소스
            <select
              className={inputClass}
              onChange={(event) =>
                updateSettings({
                  projectSource: event.target
                    .value as BuilderSectionSettings["projectSource"]
                })
              }
              value={section.settings.projectSource ?? "featured"}
            >
              <option value="featured">대표 작업</option>
              <option value="all">전체 작업</option>
            </select>
          </label>
          <label className={labelClass}>
            카테고리
            <select
              className={inputClass}
              onChange={(event) =>
                updateSettings({ category: event.target.value || undefined })
              }
              value={section.settings.category ?? ""}
            >
              <option value="">전체</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            표시 개수
            <input
              className={inputClass}
              min={1}
              onChange={(event) =>
                updateSettings({ projectLimit: Number(event.target.value) })
              }
              type="number"
              value={section.settings.projectLimit ?? 6}
            />
          </label>
          <label className={labelClass}>
            열
            <select
              className={inputClass}
              onChange={(event) =>
                updateSettings({
                  columns: Number(event.target.value) as 1 | 2 | 3 | 4
                })
              }
              value={section.settings.columns ?? 3}
            >
              <option value={2}>2열</option>
              <option value={3}>3열</option>
              <option value={4}>4열</option>
            </select>
          </label>
          <label className={labelClass}>
            보기 방식
            <select
              className={inputClass}
              onChange={(event) =>
                updateSettings({
                  gridStyle: event.target
                    .value as BuilderSectionSettings["gridStyle"]
                })
              }
              value={section.settings.gridStyle ?? "cards"}
            >
              <option value="cards">카드형</option>
              <option value="grid">그리드형</option>
              <option value="list">리스트형</option>
              <option value="masonry">Masonry</option>
            </select>
          </label>
        </>
      ) : null}
    </section>
  );
}

type BlockInspectorProps = {
  block: BuilderBlock;
  onChange: (block: BuilderBlock) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
};

function BlockInspector({
  block,
  onChange,
  onImageUpload
}: BlockInspectorProps) {
  return (
    <section className="grid gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
          블록 설정
        </h2>
        <p className="mt-1 text-sm font-medium text-neutral-950 dark:text-neutral-50">
          {blockLabels[block.type]}
        </p>
      </div>
      <BlockFields
        block={block}
        onChange={onChange}
        onImageUpload={onImageUpload}
      />
    </section>
  );
}

type BlockFieldsProps = {
  block: BuilderBlock;
  onChange: (block: BuilderBlock) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
};

function UploadButton({
  onUploaded,
  onImageUpload
}: {
  onUploaded: (url: string) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
}) {
  return (
    <label className={`${buttonClass} w-fit cursor-pointer`}>
      <Upload aria-hidden size={15} />
      이미지 업로드
      <input
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          onImageUpload(onUploaded, event.target.files?.[0]);
          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}

function BlockFields({ block, onChange, onImageUpload }: BlockFieldsProps) {
  switch (block.type) {
    case "heading":
      return (
        <>
          <label className={labelClass}>
            텍스트
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, text: event.target.value }
                })
              }
              value={block.content.text}
            />
          </label>
          <label className={labelClass}>
            단계
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  settings: {
                    ...block.settings,
                    level: Number(event.target.value) as 1 | 2 | 3
                  }
                })
              }
              value={block.settings.level ?? 2}
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>
        </>
      );
    case "paragraph":
      return (
        <>
          <label className={labelClass}>
            본문
            <textarea
              className={textareaClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, text: event.target.value }
                })
              }
              value={block.content.text}
            />
          </label>
          <label className={labelClass}>
            너비
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  settings: {
                    ...block.settings,
                    width: event.target.value as "narrow" | "content" | "wide"
                  }
                })
              }
              value={block.settings.width ?? "content"}
            >
              <option value="narrow">좁게</option>
              <option value="content">기본</option>
              <option value="wide">넓게</option>
            </select>
          </label>
        </>
      );
    case "image":
      return (
        <>
          <label className={labelClass}>
            이미지 URL
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, src: event.target.value }
                })
              }
              value={block.content.src}
            />
          </label>
          <UploadButton
            onImageUpload={onImageUpload}
            onUploaded={(url) =>
              onChange({ ...block, content: { ...block.content, src: url } })
            }
          />
          <label className={labelClass}>
            대체 텍스트
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, alt: event.target.value }
                })
              }
              value={block.content.alt}
            />
          </label>
          <label className={labelClass}>
            캡션
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, caption: event.target.value }
                })
              }
              value={block.content.caption ?? ""}
            />
          </label>
        </>
      );
    case "gallery":
      return (
        <>
          {block.content.images.map((image, index) => (
            <div
              className="grid gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
              key={`${image.src}-${index}`}
            >
              <label className={labelClass}>
                이미지 URL
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      content: {
                        images: block.content.images.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, src: event.target.value }
                            : item
                        )
                      }
                    })
                  }
                  value={image.src}
                />
              </label>
              <UploadButton
                onImageUpload={onImageUpload}
                onUploaded={(url) =>
                  onChange({
                    ...block,
                    content: {
                      images: block.content.images.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, src: url } : item
                      )
                    }
                  })
                }
              />
            </div>
          ))}
          <button
            className={buttonClass}
            onClick={() =>
              onChange({
                ...block,
                content: {
                  images: [
                    ...block.content.images,
                    {
                      src: "/images/placeholder-atlas-grid-1.svg",
                      alt: "갤러리 이미지",
                      caption: ""
                    }
                  ]
                }
              })
            }
            type="button"
          >
            <Plus aria-hidden size={15} />
            이미지 추가
          </button>
        </>
      );
    case "button":
      return (
        <>
          <label className={labelClass}>
            라벨
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, label: event.target.value }
                })
              }
              value={block.content.label}
            />
          </label>
          <label className={labelClass}>
            링크
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, href: event.target.value }
                })
              }
              value={block.content.href}
            />
          </label>
        </>
      );
    case "divider":
      return (
        <label className={labelClass}>
          스타일
          <select
            className={inputClass}
            onChange={(event) =>
              onChange({
                ...block,
                settings: {
                  ...block.settings,
                  style: event.target.value as "line" | "dashed" | "blank"
                }
              })
            }
            value={block.settings.style ?? "line"}
          >
            <option value="line">실선</option>
            <option value="dashed">점선</option>
            <option value="blank">빈 여백</option>
          </select>
        </label>
      );
    case "embed":
      return (
        <label className={labelClass}>
          URL
          <input
            className={inputClass}
            onChange={(event) =>
              onChange({
                ...block,
                content: { ...block.content, url: event.target.value }
              })
            }
            value={block.content.url}
          />
        </label>
      );
    case "spacer":
      return (
        <label className={labelClass}>
          높이
          <input
            className={inputClass}
            min={0}
            onChange={(event) =>
              onChange({
                ...block,
                settings: {
                  ...block.settings,
                  height: Number(event.target.value)
                }
              })
            }
            type="number"
            value={block.settings.height ?? 48}
          />
        </label>
      );
    case "quote":
      return (
        <>
          <label className={labelClass}>
            인용문
            <textarea
              className={textareaClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, text: event.target.value }
                })
              }
              value={block.content.text}
            />
          </label>
          <label className={labelClass}>
            작성자
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, author: event.target.value }
                })
              }
              value={block.content.author ?? ""}
            />
          </label>
        </>
      );
    case "stats":
      return (
        <>
          <label className={labelClass}>
            값
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, value: event.target.value }
                })
              }
              value={block.content.value}
            />
          </label>
          <label className={labelClass}>
            라벨
            <input
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: { ...block.content, label: event.target.value }
                })
              }
              value={block.content.label}
            />
          </label>
        </>
      );
  }
}
