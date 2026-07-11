"use client";

import Link from "next/link";
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
  Clipboard,
  Copy,
  Eye,
  GripVertical,
  Loader2,
  Monitor,
  PanelRight,
  Plus,
  Redo2,
  Save,
  Send,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  Upload
} from "lucide-react";
import {
  type ClipboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { BuilderPageRenderer } from "@/components/builder-page-renderer";
import {
  getImageFileFromDataTransfer,
  readClipboardImageFile
} from "@/lib/client-uploads";
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderPage,
  BuilderSection,
  BuilderSectionSettings,
  BuilderSectionType,
  BuilderTabItem,
  BuilderTextFont,
  BuilderTextSettings,
  BuilderViewport,
  Note,
  Project,
  StudioArchiveContent
} from "@/lib/types";

type PageBuilderEditorProps = {
  authEnabled: boolean;
  canManageAccounts?: boolean;
  editBasePath?: string;
  pageSlug?: "home" | "archive";
};

type BuilderHistory = {
  past: BuilderPage[];
  future: BuilderPage[];
};

type SortableRowProps = {
  id: string;
  active?: boolean;
  children: React.ReactNode;
};

function scrollEditorElementIntoView(selector: string) {
  window.requestAnimationFrame(() => {
    document.querySelector(selector)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  });
}

type SectionPreset = {
  id: string;
  label: string;
  description: string;
  create: () => BuilderSection;
};

type BlockInsertOption = {
  id: string;
  kind: "block";
  label: string;
  description: string;
  command?: string;
  aliases?: string[];
  create: () => BuilderBlock;
};

type SectionInsertOption = {
  id: string;
  kind: "section";
  label: string;
  description: string;
  command?: string;
  aliases?: string[];
  create: () => BuilderSection;
};

type InsertOption = BlockInsertOption | SectionInsertOption;

type InsertOptionGroup = {
  label: string;
  items: InsertOption[];
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
  bulletList: "글머리 목록",
  numberedList: "번호 목록",
  tabs: "탭",
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
  "bulletList",
  "numberedList",
  "tabs",
  "image",
  "gallery",
  "button",
  "divider",
  "embed",
  "spacer",
  "quote",
  "stats"
];

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

const legacyTextSizePt: Record<string, number> = {
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
const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-neutral-50";
const publicPortfolioSuffix = "portfoilo";

function normalizePublicPortfolioName(value: string) {
  const normalized = value.trim().toLowerCase().normalize("NFKC");
  let nextValue = "";

  for (const character of normalized) {
    const code = character.charCodeAt(0);
    const isLetterOrNumber =
      (code >= 48 && code <= 57) ||
      (code >= 97 && code <= 122) ||
      (code >= 65 && code <= 90);
    const isHangul = code >= 0xac00 && code <= 0xd7a3;

    if (isLetterOrNumber || isHangul || character === "_") {
      nextValue += character;
      continue;
    }

    if (character === "-" || /\s/.test(character)) {
      nextValue += "-";
    }
  }

  return nextValue.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function getPublicPortfolioSlug(value: string) {
  const normalizedName = normalizePublicPortfolioName(value);
  const name = normalizedName || "my";
  const suffix = `-${publicPortfolioSuffix}`;

  return name.endsWith(suffix) ? name : `${name}${suffix}`;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function orderItems<T extends { order: number }>(items: T[]) {
  return items.map((item, index) => ({ ...item, order: index }));
}

function isSameObjectValue(firstValue: unknown, secondValue: unknown) {
  return JSON.stringify(firstValue) === JSON.stringify(secondValue);
}

function mergeBlockUpdate(
  currentBlock: BuilderBlock,
  nextBlock: BuilderBlock
): BuilderBlock {
  if (currentBlock.id !== nextBlock.id || currentBlock.type !== nextBlock.type) {
    return nextBlock;
  }

  const contentChanged = !isSameObjectValue(
    currentBlock.content,
    nextBlock.content
  );
  const settingsChanged = !isSameObjectValue(
    currentBlock.settings,
    nextBlock.settings
  );

  if (contentChanged && settingsChanged) {
    return {
      ...currentBlock,
      ...nextBlock,
      content: currentBlock.content,
      settings: nextBlock.settings
    } as BuilderBlock;
  }

  return nextBlock;
}

function mergeSectionUpdate(
  currentSection: BuilderSection,
  nextSection: BuilderSection
): BuilderSection {
  if (currentSection.id !== nextSection.id) {
    return nextSection;
  }

  const blocksChanged = !isSameObjectValue(
    currentSection.blocks,
    nextSection.blocks
  );
  const settingsChanged = !isSameObjectValue(
    currentSection.settings,
    nextSection.settings
  );

  if (blocksChanged && settingsChanged) {
    return {
      ...currentSection,
      ...nextSection,
      blocks: currentSection.blocks,
      settings: nextSection.settings
    };
  }

  return nextSection;
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
    case "bulletList":
      return {
        id,
        type,
        order: 0,
        content: { items: ["목록 항목"] },
        settings: { align: "left" }
      };
    case "numberedList":
      return {
        id,
        type,
        order: 0,
        content: { items: ["번호 목록 항목"] },
        settings: { align: "left" }
      };
    case "tabs": {
      const tabs: BuilderTabItem[] = [1, 2, 3].map((index) => ({
        id: createId("tab"),
        blocks:
          index === 1
            ? [
                {
                  id: createId("block"),
                  type: "paragraph",
                  order: 0,
                  content: {
                    text: "빈 탭입니다. 내용을 입력하거나 블록을 추가해보세요."
                  },
                  settings: { width: "content", align: "left" }
                }
              ]
            : [],
        label: `탭 ${index}`,
        text:
          index === 1
            ? "빈 탭입니다. 내용을 입력하거나 탭을 추가해보세요."
            : ""
      }));

      return {
        id,
        type,
        order: 0,
        content: { tabs },
        settings: { activeTabId: tabs[0]?.id, style: "soft" }
      };
    }
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

function createTypedBlock<Type extends BuilderBlockType>(type: Type) {
  return createBlock(type) as Extract<BuilderBlock, { type: Type }>;
}

function createHeadingBlock(level: 1 | 2 | 3 | 4) {
  const block = createTypedBlock("heading");

  return {
    ...block,
    content: {
      text:
        level === 1
          ? "새 큰 제목"
          : level === 2
            ? "새 제목"
            : level === 3
              ? "새 소제목"
              : "새 세부 제목"
    },
    settings: {
      ...block.settings,
      level
    }
  };
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
    backgroundImage: "",
    backgroundImagePosition: "center",
    backgroundImageSize: "cover",
    backgroundOverlay: "none",
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

function createSectionWithSettings(
  type: BuilderSectionType,
  settings: Partial<BuilderSectionSettings>
) {
  const section = createSection(type);

  return {
    ...section,
    settings: {
      ...section.settings,
      ...settings
    }
  };
}

const sectionPresets: SectionPreset[] = [
  {
    id: "opening-statement",
    label: "첫 화면 소개",
    description: "큰 제목, 짧은 설명, 작업 보기 버튼",
    create: () => {
      const section = createSection("hero");
      return {
        ...section,
        settings: {
          ...section.settings,
          paddingY: "xl",
          maxWidth: "wide"
        },
        blocks: orderItems([
          {
            ...createTypedBlock("heading"),
            content: {
              text: "작업의 맥락을 또렷하게 보여주는 포트폴리오."
            },
            settings: {
              level: 1,
              align: "left"
            }
          },
          {
            ...createTypedBlock("paragraph"),
            content: {
              text:
                "프로젝트의 이미지와 과정, 결과를 한 화면에서 차분하게 정리합니다."
            }
          },
          {
            ...createTypedBlock("button"),
            content: {
              label: "프로젝트 보기",
              href: "/projects"
            }
          }
        ])
      };
    }
  },
  {
    id: "featured-projects",
    label: "대표 프로젝트",
    description: "제목과 프로젝트 그리드",
    create: () => {
      const section = createSection("projectGrid");
      return {
        ...section,
        settings: {
          ...section.settings,
          columns: 3,
          gridStyle: "cards",
          projectSource: "featured",
          projectLimit: 6
        },
        blocks: orderItems([
          {
            ...createTypedBlock("heading"),
            content: {
              text: "선별한 프로젝트"
            },
            settings: {
              level: 2,
              align: "left"
            }
          },
          {
            ...createTypedBlock("paragraph"),
            content: {
              text: "브랜딩, 제품, 편집, 모션 작업을 간결하게 묶었습니다."
            }
          }
        ])
      };
    }
  },
  {
    id: "contact-cta",
    label: "연락 CTA",
    description: "문의 문구와 메일 버튼",
    create: () => {
      const section = createSection("contact");
      return {
        ...section,
        settings: {
          ...section.settings,
          maxWidth: "content",
          paddingY: "lg"
        },
        blocks: orderItems([
          {
            ...createTypedBlock("heading"),
            content: {
              text: "함께 만들 이야기가 있다면"
            },
            settings: {
              level: 2,
              align: "left"
            }
          },
          {
            ...createTypedBlock("paragraph"),
            content: {
              text: "작업 의뢰와 협업 제안을 편하게 보내주세요."
            }
          },
          {
            ...createTypedBlock("button"),
            content: {
              label: "연락하기",
              href: "mailto:hello@example.com"
            },
            settings: {
              variant: "secondary",
              align: "left"
            }
          }
        ])
      };
    }
  }
];

const baseBlockInsertOptions: BlockInsertOption[] = [
  {
    id: "block-heading",
    kind: "block",
    label: "제목",
    description: "섹션의 흐름을 나누는 제목",
    create: () => createBlock("heading")
  },
  {
    id: "block-paragraph",
    kind: "block",
    label: "본문",
    description: "짧은 설명이나 긴 글",
    create: () => createBlock("paragraph")
  },
  {
    id: "block-bullet-list",
    kind: "block",
    label: "글머리 목록",
    description: "핵심 내용을 목록으로 정리",
    create: () => createBlock("bulletList")
  },
  {
    id: "block-numbered-list",
    kind: "block",
    label: "번호 목록",
    description: "순서가 있는 내용을 정리",
    create: () => createBlock("numberedList")
  },
  {
    id: "block-tabs",
    kind: "block",
    label: "탭",
    description: "내용을 탭으로 나누어 정리",
    create: () => createBlock("tabs")
  },
  {
    id: "block-image",
    kind: "block",
    label: "이미지",
    description: "한 장의 대표 이미지",
    create: () => createBlock("image")
  },
  {
    id: "block-gallery",
    kind: "block",
    label: "갤러리",
    description: "여러 이미지를 묶어서 표시",
    create: () => createBlock("gallery")
  },
  {
    id: "block-button",
    kind: "block",
    label: "버튼",
    description: "링크나 행동 버튼",
    create: () => createBlock("button")
  },
  {
    id: "block-quote",
    kind: "block",
    label: "인용",
    description: "강조 문장이나 코멘트",
    create: () => createBlock("quote")
  },
  {
    id: "block-divider",
    kind: "block",
    label: "구분선",
    description: "콘텐츠 사이를 가볍게 분리",
    create: () => createBlock("divider")
  },
  {
    id: "block-spacer",
    kind: "block",
    label: "여백",
    description: "섹션 안의 간격 조절",
    create: () => createBlock("spacer")
  },
  {
    id: "block-embed",
    kind: "block",
    label: "임베드",
    description: "외부 영상이나 링크 삽입",
    create: () => createBlock("embed")
  }
];

const sectionInsertOptions: SectionInsertOption[] = [
  {
    id: "section-hero",
    kind: "section",
    label: "Hero",
    description: "첫 화면용 큰 소개 섹션",
    create: () => createSection("hero")
  },
  {
    id: "section-project-grid",
    kind: "section",
    label: "Project Grid",
    description: "프로젝트를 이미지 중심으로 정리",
    create: () => createSection("projectGrid")
  },
  {
    id: "section-image-gallery",
    kind: "section",
    label: "Image Gallery",
    description: "이미지 묶음을 넓게 보여주는 섹션",
    create: () => createSection("imageGallery")
  },
  {
    id: "section-text",
    kind: "section",
    label: "Text Section",
    description: "문장 중심의 차분한 섹션",
    create: () => createSection("textSection")
  },
  {
    id: "section-two-column",
    kind: "section",
    label: "Two Column",
    description: "텍스트와 이미지를 나란히 배치",
    create: () => createSection("twoColumn")
  },
  {
    id: "section-contact",
    kind: "section",
    label: "Contact",
    description: "문의 문구와 연락 버튼",
    create: () => createSection("contact")
  },
  {
    id: "section-archive",
    kind: "section",
    label: "Archive List",
    description: "노트와 기록을 목록으로 표시",
    create: () => createSection("archiveList")
  }
];

const layoutInsertOptions: SectionInsertOption[] = [
  {
    id: "layout-two-column",
    kind: "section",
    label: "2 Column",
    description: "두 열로 나뉘는 기본 레이아웃",
    create: () => createSectionWithSettings("twoColumn", { columns: 2 })
  },
  {
    id: "layout-three-column",
    kind: "section",
    label: "3 Column",
    description: "세 열 카드나 설명을 놓기 좋은 레이아웃",
    create: () => createSectionWithSettings("twoColumn", { columns: 3 })
  },
  {
    id: "layout-card-grid",
    kind: "section",
    label: "Card Grid",
    description: "카드형 프로젝트 그리드",
    create: () =>
      createSectionWithSettings("projectGrid", {
        gridStyle: "cards",
        columns: 3
      })
  },
  {
    id: "layout-masonry-grid",
    kind: "section",
    label: "Masonry Grid",
    description: "이미지 비율을 살리는 그리드",
    create: () =>
      createSectionWithSettings("projectGrid", {
        gridStyle: "masonry",
        columns: 3
      })
  }
];

const addMenuGroups: InsertOptionGroup[] = [
  {
    label: "기본 블록",
    items: baseBlockInsertOptions
  },
  {
    label: "섹션",
    items: sectionInsertOptions
  },
  {
    label: "레이아웃",
    items: layoutInsertOptions
  }
];

const slashCommandOptions: InsertOption[] = [
  {
    id: "command-h1",
    kind: "block",
    label: "제목 1",
    description: "큰 제목 블록",
    command: "/#",
    aliases: ["h1", "/h1", "#", "제목1", "큰제목"],
    create: () => createHeadingBlock(1)
  },
  {
    id: "command-h2",
    kind: "block",
    label: "제목 2",
    description: "기본 제목 블록",
    command: "/##",
    aliases: ["h2", "/h2", "##", "제목2", "제목"],
    create: () => createHeadingBlock(2)
  },
  {
    id: "command-h3",
    kind: "block",
    label: "제목 3",
    description: "작은 제목 블록",
    command: "/###",
    aliases: ["h3", "/h3", "###", "제목3", "소제목"],
    create: () => createHeadingBlock(3)
  },
  {
    id: "command-h4",
    kind: "block",
    label: "제목 4",
    description: "더 작은 제목 블록",
    command: "/####",
    aliases: ["h4", "/h4", "####", "제목4", "세부제목"],
    create: () => createHeadingBlock(4)
  },
  {
    id: "command-text",
    kind: "block",
    label: "본문",
    description: "문단 블록",
    command: "/text",
    aliases: ["text", "본문", "paragraph"],
    create: () => createBlock("paragraph")
  },
  {
    id: "command-bullet-list",
    kind: "block",
    label: "글머리 목록",
    description: "글머리 기호 목록",
    command: "/-",
    aliases: ["ul", "bullet", "글머리", "목록", "불릿"],
    create: () => createBlock("bulletList")
  },
  {
    id: "command-numbered-list",
    kind: "block",
    label: "번호 목록",
    description: "번호 매기기 목록",
    command: "/1.",
    aliases: ["ol", "number", "번호", "번호목록", "순서"],
    create: () => createBlock("numberedList")
  },
  {
    id: "command-tabs",
    kind: "block",
    label: "탭",
    description: "탭으로 나눈 콘텐츠 블록",
    command: "/tabs",
    aliases: ["tab", "tabs", "탭"],
    create: () => createBlock("tabs")
  },
  {
    id: "command-image",
    kind: "block",
    label: "이미지",
    description: "이미지 블록",
    command: "/image",
    aliases: ["image", "이미지"],
    create: () => createBlock("image")
  },
  {
    id: "command-gallery",
    kind: "block",
    label: "갤러리",
    description: "이미지 갤러리 블록",
    command: "/gallery",
    aliases: ["gallery", "갤러리"],
    create: () => createBlock("gallery")
  },
  {
    id: "command-quote",
    kind: "block",
    label: "인용",
    description: "인용문 블록",
    command: "/quote",
    aliases: ["quote", "인용"],
    create: () => createBlock("quote")
  },
  {
    id: "command-button",
    kind: "block",
    label: "버튼",
    description: "링크 버튼 블록",
    command: "/button",
    aliases: ["button", "버튼"],
    create: () => createBlock("button")
  },
  {
    id: "command-divider",
    kind: "block",
    label: "구분선",
    description: "구분선 블록",
    command: "/divider",
    aliases: ["divider", "구분선"],
    create: () => createBlock("divider")
  },
  {
    id: "command-embed",
    kind: "block",
    label: "임베드",
    description: "외부 콘텐츠 임베드",
    command: "/embed",
    aliases: ["embed", "임베드"],
    create: () => createBlock("embed")
  },
  {
    id: "command-spacer",
    kind: "block",
    label: "여백",
    description: "빈 간격 블록",
    command: "/spacer",
    aliases: ["spacer", "여백"],
    create: () => createBlock("spacer")
  },
  {
    id: "command-grid",
    kind: "section",
    label: "프로젝트 그리드",
    description: "프로젝트 목록 섹션",
    command: "/grid",
    aliases: ["grid", "프로젝트그리드", "projectgrid"],
    create: () => createSection("projectGrid")
  },
  {
    id: "command-contact",
    kind: "section",
    label: "연락처",
    description: "연락 섹션",
    command: "/contact",
    aliases: ["contact", "연락처", "연락"],
    create: () => createSection("contact")
  }
];

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
      data-builder-block-row={id}
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

export function PageBuilderEditor({
  authEnabled,
  canManageAccounts = true,
  editBasePath = "/admin",
  pageSlug = "home"
}: PageBuilderEditorProps) {
  const [page, setPage] = useState<BuilderPage | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [viewport, setViewport] = useState<BuilderViewport>("desktop");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(true);
  const [history, setHistory] = useState<BuilderHistory>({
    past: [],
    future: []
  });
  const pageRef = useRef<BuilderPage | null>(null);
  const [commandValue, setCommandValue] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const pageApiPath = useMemo(
    () => `/api/admin/page?slug=${pageSlug}`,
    [pageSlug]
  );
  const editorGridClass = isSettingsPanelOpen
    ? "grid min-h-[calc(var(--app-viewport-height)-65px)] lg:h-[calc(var(--app-viewport-height)-130px)] lg:min-h-0 lg:grid-cols-[280px_1fr_340px]"
    : "grid min-h-[calc(var(--app-viewport-height)-65px)] lg:h-[calc(var(--app-viewport-height)-130px)] lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)]";

  useEffect(() => {
    let mounted = true;

    async function loadEditor() {
      try {
        setIsLoading(true);
        const [pageResponse, contentResponse] = await Promise.all([
          fetch(pageApiPath, { cache: "no-store" }),
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
        setHistory({ past: [], future: [] });
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
  }, [pageApiPath]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

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
  const commandQuery = commandValue.trimStart().startsWith("/")
    ? commandValue.trimStart().slice(1).trim().toLowerCase()
    : "";
  const commandMatches = useMemo(() => {
    if (!commandValue.trimStart().startsWith("/")) {
      return [];
    }

    if (!commandQuery) {
      return slashCommandOptions;
    }

    return slashCommandOptions.filter((option) => {
      const haystack = [
        option.command,
        option.label,
        option.description,
        ...(option.aliases ?? [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(commandQuery);
    });
  }, [commandQuery, commandValue]);

  useEffect(() => {
    if (!selectedBlockId) {
      return;
    }

    scrollEditorElementIntoView(
      `[data-builder-block-inspector="${selectedBlockId}"], [data-builder-block-row="${selectedBlockId}"]`
    );
  }, [selectedBlockId, selectedSectionId]);

  const commitPage = (nextPage: BuilderPage) => {
    const currentPage = pageRef.current;

    if (currentPage) {
      setHistory((currentHistory) => ({
        past: [...currentHistory.past.slice(-39), currentPage],
        future: []
      }));
    }

    const nextDraftPage: BuilderPage = {
      ...nextPage,
      status: "draft"
    };

    pageRef.current = nextDraftPage;
    setPage(nextDraftPage);
  };

  const updatePage = (updater: (currentPage: BuilderPage) => BuilderPage) => {
    const currentPage = pageRef.current;

    if (!currentPage) {
      return;
    }

    const nextPage: BuilderPage = {
      ...updater(currentPage),
      status: "draft"
    };

    setHistory((currentHistory) => ({
      past: [...currentHistory.past.slice(-39), currentPage],
      future: []
    }));

    pageRef.current = nextPage;
    setPage(nextPage);
  };

  const undo = () => {
    if (!page || history.past.length === 0) {
      return;
    }

    const previousPage = history.past[history.past.length - 1];
    setHistory({
      past: history.past.slice(0, -1),
      future: [page, ...history.future]
    });
    pageRef.current = previousPage;
    setPage(previousPage);
    setSelectedSectionId(previousPage.sections[0]?.id ?? "");
    setSelectedBlockId("");
  };

  const redo = () => {
    if (!page || history.future.length === 0) {
      return;
    }

    const nextPage = history.future[0];
    setHistory({
      past: [...history.past, page],
      future: history.future.slice(1)
    });
    pageRef.current = nextPage;
    setPage(nextPage);
    setSelectedSectionId(nextPage.sections[0]?.id ?? "");
    setSelectedBlockId("");
  };

  const updateSelectedSection = (section: BuilderSection) => {
    updatePage((currentPage) => ({
      ...currentPage,
      sections: orderItems(
        currentPage.sections.map((currentSection) =>
          currentSection.id === section.id
            ? mergeSectionUpdate(currentSection, section)
            : currentSection
        )
      )
    }));
  };

  const updateSelectedBlock = (block: BuilderBlock) => {
    updatePage((currentPage) => ({
      ...currentPage,
      sections: orderItems(
        currentPage.sections.map((section) => {
          const isTargetSection =
            section.id === selectedSectionId ||
            section.blocks.some((currentBlock) => currentBlock.id === block.id);

          if (!isTargetSection) {
            return section;
          }

          return {
            ...section,
            blocks: orderItems(
              section.blocks.map((currentBlock) =>
                currentBlock.id === block.id
                  ? mergeBlockUpdate(currentBlock, block)
                  : currentBlock
              )
            )
          };
        })
      )
    }));
  };

  const updateBlockInSection = (sectionId: string, block: BuilderBlock) => {
    updatePage((currentPage) => ({
      ...currentPage,
      sections: orderItems(
        currentPage.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                blocks: orderItems(
                  section.blocks.map((currentBlock) =>
                    currentBlock.id === block.id
                      ? mergeBlockUpdate(currentBlock, block)
                      : currentBlock
                  )
                )
              }
            : section
        )
      )
    }));
    setSelectedSectionId(sectionId);
    setSelectedBlockId(block.id);
  };

  const insertSectionAtSelection = (section: BuilderSection) => {
    if (!page) {
      return;
    }

    const insertAfterIndex = sortedSections.findIndex(
      (currentSection) => currentSection.id === selectedSectionId
    );
    const insertIndex =
      insertAfterIndex >= 0 ? insertAfterIndex + 1 : sortedSections.length;
    const nextSections = [...sortedSections];
    nextSections.splice(insertIndex, 0, section);

    commitPage({ ...page, sections: orderItems(nextSections) });
    setSelectedSectionId(section.id);
    setSelectedBlockId("");
    setStatus(`${sectionLabels[section.type]} 섹션을 추가했습니다.`);
  };

  const addSection = (type: BuilderSectionType) => {
    insertSectionAtSelection(createSection(type));
  };

  const addPresetSection = (section: BuilderSection) => {
    insertSectionAtSelection(section);
  };

  const insertBlockAtSelection = (block: BuilderBlock) => {
    if (!page) {
      return;
    }

    const fallbackSection =
      sortedSections.length > 0 ? sortedSections[sortedSections.length - 1] : null;
    const targetSection = selectedSection ?? fallbackSection;

    if (!targetSection) {
      const section = {
        ...createSection("textSection"),
        blocks: orderItems([block])
      };

      commitPage({ ...page, sections: [section] });
      setSelectedSectionId(section.id);
      setSelectedBlockId(block.id);
      setStatus(`${blockLabels[block.type]} 블록을 추가했습니다.`);
      return;
    }

    const nextSections = sortedSections.map((section) => {
      if (section.id !== targetSection.id) {
        return section;
      }

      const sortedBlocks = section.blocks
        .slice()
        .sort((a, b) => a.order - b.order);
      const selectedIndex =
        selectedBlock && selectedSection?.id === targetSection.id
          ? sortedBlocks.findIndex((item) => item.id === selectedBlock.id)
          : -1;
      const insertIndex =
        selectedIndex >= 0 ? selectedIndex + 1 : sortedBlocks.length;
      const nextBlocks = [...sortedBlocks];
      nextBlocks.splice(insertIndex, 0, block);

      return {
        ...section,
        blocks: orderItems(nextBlocks)
      };
    });

    commitPage({ ...page, sections: orderItems(nextSections) });
    setSelectedSectionId(targetSection.id);
    setSelectedBlockId(block.id);
    setStatus(`${blockLabels[block.type]} 블록을 추가했습니다.`);
  };

  const insertBlockAtPosition = (
    sectionId: string,
    insertIndex: number,
    type: BuilderBlockType
  ) => {
    if (!page) {
      return;
    }

    const block = createBlock(type);
    const nextSections = sortedSections.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }

      const sortedBlocks = section.blocks
        .slice()
        .sort((a, b) => a.order - b.order);
      const boundedIndex = Math.max(
        0,
        Math.min(insertIndex, sortedBlocks.length)
      );
      const nextBlocks = [...sortedBlocks];
      nextBlocks.splice(boundedIndex, 0, block);

      return {
        ...section,
        blocks: orderItems(nextBlocks)
      };
    });

    commitPage({ ...page, sections: orderItems(nextSections) });
    setSelectedSectionId(sectionId);
    setSelectedBlockId(block.id);
    setStatus(`${blockLabels[type]} 블록을 추가했습니다.`);
  };

  const deleteSelectedSection = () => {
    if (!page || !selectedSection) {
      return;
    }

    const sections = orderItems(
      page.sections.filter((section) => section.id !== selectedSection.id)
    );
    commitPage({ ...page, sections });
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
    commitPage({ ...page, sections: orderItems(nextSections) });
    setSelectedSectionId(copiedSection.id);
    setSelectedBlockId("");
  };

  const addBlock = (type: BuilderBlockType) => {
    insertBlockAtSelection(createBlock(type));
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

  const deleteBlockFromPreview = (sectionId: string, blockId: string) => {
    const section = sortedSections.find((item) => item.id === sectionId);

    if (!section) {
      return;
    }

    const blocks = orderItems(
      section.blocks.filter((block) => block.id !== blockId)
    );

    updateSelectedSection({ ...section, blocks });
    setSelectedSectionId(sectionId);
    setSelectedBlockId(blocks[0]?.id ?? "");
  };

  const moveBlockFromPreview = (
    sectionId: string,
    sourceBlockId: string,
    targetBlockId: string,
    placement: "before" | "after"
  ) => {
    const section = sortedSections.find((item) => item.id === sectionId);

    if (!section || sourceBlockId === targetBlockId) {
      return;
    }

    const blocks = section.blocks.slice().sort((a, b) => a.order - b.order);
    const movingBlock = blocks.find((block) => block.id === sourceBlockId);
    const targetBlock = blocks.find((block) => block.id === targetBlockId);

    if (!movingBlock || !targetBlock) {
      return;
    }

    const nextBlocks = blocks.filter((block) => block.id !== sourceBlockId);
    const targetIndex = nextBlocks.findIndex(
      (block) => block.id === targetBlockId
    );

    if (targetIndex < 0) {
      return;
    }

    nextBlocks.splice(
      placement === "after" ? targetIndex + 1 : targetIndex,
      0,
      movingBlock
    );
    updateSelectedSection({ ...section, blocks: orderItems(nextBlocks) });
    setSelectedSectionId(sectionId);
    setSelectedBlockId(sourceBlockId);
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

    commitPage({
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

  const runInsertOption = (option: InsertOption) => {
    if (option.kind === "block") {
      insertBlockAtSelection(option.create());
    } else {
      insertSectionAtSelection(option.create());
    }

    setCommandValue("");
    setIsCommandOpen(false);
    setIsAddMenuOpen(false);
    setSelectedCommandIndex(0);
  };

  const handleCommandValueChange = (value: string) => {
    setCommandValue(value);
    setSelectedCommandIndex(0);

    if (value.trimStart().startsWith("/")) {
      setIsCommandOpen(true);
      setIsAddMenuOpen(false);
      return;
    }

    setIsCommandOpen(false);
  };

  const handleCommandKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Escape") {
      setIsCommandOpen(false);
      setIsAddMenuOpen(false);
      return;
    }

    if (!isCommandOpen || commandMatches.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedCommandIndex((currentIndex) =>
        currentIndex >= commandMatches.length - 1 ? 0 : currentIndex + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedCommandIndex((currentIndex) =>
        currentIndex <= 0 ? commandMatches.length - 1 : currentIndex - 1
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      runInsertOption(
        commandMatches[
          Math.min(selectedCommandIndex, commandMatches.length - 1)
        ]
      );
    }
  };

  const savePage = async (nextPage?: BuilderPage | null) => {
    const pageToSave = nextPage ?? pageRef.current;

    if (!pageToSave) {
      return;
    }

    try {
      setIsSaving(true);
      setStatus("초안을 저장하는 중입니다.");

      const response = await fetch(pageApiPath, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(pageToSave)
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
      pageRef.current = savedPage;
      setPage(savedPage);
      setStatus("초안이 저장되었습니다. 공개 페이지에는 아직 반영되지 않습니다.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "페이지를 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const publishPage = async () => {
    const currentPage = pageRef.current;

    if (!currentPage) {
      return;
    }

    const pageToPublish = {
      ...currentPage,
      publicSlug: getPublicPortfolioSlug(
        currentPage.publicSlug || currentPage.publishName || currentPage.title
      )
    };

    try {
      setIsSaving(true);
      setStatus("게시하는 중입니다.");

      const response = await fetch(`${pageApiPath}&publish=true`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(pageToPublish)
      });

      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "페이지를 게시하지 못했습니다.");
      }

      const publishedPage = (await response.json()) as BuilderPage;
      pageRef.current = publishedPage;
      setPage(publishedPage);
      setHistory({ past: [], future: [] });
      const publicPath =
        pageSlug === "archive"
          ? "/archive"
          : `/${publishedPage.publishedPublicSlug ?? publishedPage.publicSlug ?? ""}`;
      setStatus(`게시되었습니다. 공개 주소: ${publicPath}`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "페이지를 게시하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
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

  const handleClipboardImageUpload = async (onUploaded: (url: string) => void) => {
    try {
      const file = await readClipboardImageFile();

      if (!file) {
        window.alert("클립보드에 이미지가 없습니다.");
        return;
      }

      await handleImageUpload(onUploaded, file);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "클립보드 이미지를 불러오지 못했습니다."
      );
    }
  };

  const handleImagePaste = (
    onUploaded: (url: string) => void,
    event: ClipboardEvent<HTMLInputElement>
  ) => {
    const file = getImageFileFromDataTransfer(event.clipboardData);

    if (!file) {
      return;
    }

    event.preventDefault();
    void handleImageUpload(onUploaded, file);
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

  const draftPublicSlug = getPublicPortfolioSlug(
    page.publicSlug || page.publishName || page.title
  );
  const publishedPublicPath =
    pageSlug === "archive"
      ? "/archive"
      : page.publishedPublicSlug
        ? `/${page.publishedPublicSlug}`
        : "";
  const nextPublicPath =
    pageSlug === "archive" ? "/archive" : `/${draftPublicSlug}`;
  const projectsEditHref = `${editBasePath}/projects`;
  const archiveEditHref = `${editBasePath}/archive`;

  return (
    <div className="min-h-[var(--app-viewport-height)] bg-neutral-100 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="flex items-center gap-3">
          <PanelRight aria-hidden size={18} />
          <div>
            <h1 className="text-sm font-semibold">페이지 빌더</h1>
            <p className="text-xs text-neutral-500">
              {authEnabled ? "관리자 로그인 사용 중" : "로그인 환경변수 필요"}
            </p>
          </div>
          <span className="rounded-sm border border-neutral-200 px-2 py-1 text-xs text-neutral-500 dark:border-neutral-800">
            {page.status === "draft" ? "초안" : "게시됨"}
          </span>
          {page.publishedAt ? (
            <span className="hidden text-xs text-neutral-500 md:inline">
              마지막 게시 {new Date(page.publishedAt).toLocaleDateString("ko-KR")}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className={buttonClass} href={projectsEditHref}>
            프로젝트 편집
          </Link>
          <Link className={buttonClass} href={archiveEditHref}>
            아카이브 편집
          </Link>
          {canManageAccounts ? (
          <Link className={buttonClass} href="/admin/accounts">
            계정 승인
          </Link>
          ) : null}
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
            disabled={history.past.length === 0}
            onClick={undo}
            type="button"
          >
            <Undo2 aria-hidden size={16} />
            되돌리기
          </button>
          <button
            className={buttonClass}
            disabled={history.future.length === 0}
            onClick={redo}
            type="button"
          >
            <Redo2 aria-hidden size={16} />
            다시 실행
          </button>
          <button
            className={buttonClass}
            onClick={() =>
              window.open(
                publishedPublicPath || nextPublicPath,
                "_blank",
                "noopener,noreferrer"
              )
            }
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
            초안 저장
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

      <div className={editorGridClass}>
        <aside className="border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 lg:h-full lg:overflow-y-auto lg:overscroll-contain">
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
                추천 프리셋
              </h2>
              <div className="mt-3 grid gap-2">
                {sectionPresets.map((preset) => (
                  <button
                    className="rounded-md border border-neutral-200 bg-white p-3 text-left text-sm transition hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
                    key={preset.id}
                    onClick={() => addPresetSection(preset.create())}
                    type="button"
                  >
                    <span className="block font-medium text-neutral-950 dark:text-neutral-50">
                      {preset.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-neutral-500">
                      {preset.description}
                    </span>
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

        <main className="min-h-[720px] overflow-auto bg-neutral-100 p-4 pb-28 dark:bg-neutral-900 lg:min-h-0">
          {!isSettingsPanelOpen ? (
            <button
              className="mb-3 ml-auto inline-flex min-h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-600"
              onClick={() => setIsSettingsPanelOpen(true)}
              type="button"
            >
              <PanelRight aria-hidden size={15} />
              설정 열기
            </button>
          ) : null}
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
              onChangeBlock={updateBlockInSection}
              onDeleteBlock={deleteBlockFromPreview}
              onInsertBlock={insertBlockAtPosition}
              onMoveBlock={moveBlockFromPreview}
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

        {isSettingsPanelOpen ? (
        <aside className="border-l border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 lg:h-full lg:overflow-y-auto lg:overscroll-contain">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              설정
            </h2>
            <button
              aria-label="설정 패널 숨기기"
              className={iconButtonClass}
              onClick={() => setIsSettingsPanelOpen(false)}
              type="button"
            >
              <PanelRight aria-hidden size={16} />
            </button>
          </div>
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
                    updatePage((currentPage) => ({
                      ...currentPage,
                      title: event.target.value
                    }))
                  }
                  value={page.title}
                />
              </label>
              <label className={labelClass}>
                SEO 제목
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updatePage((currentPage) => ({
                      ...currentPage,
                      seoTitle: event.target.value
                    }))
                  }
                  value={page.seoTitle}
                />
              </label>
              <label className={labelClass}>
                SEO 설명
                <textarea
                  className={textareaClass}
                  onChange={(event) =>
                    updatePage((currentPage) => ({
                      ...currentPage,
                      seoDescription: event.target.value
                    }))
                  }
                  value={page.seoDescription}
                />
              </label>
              <label className={labelClass}>
                게시 설정명
                <input
                  className={inputClass}
                  onChange={(event) => {
                    const publishName = event.target.value;

                    updatePage((currentPage) => ({
                      ...currentPage,
                      publishName,
                      publicSlug: getPublicPortfolioSlug(
                        publishName || currentPage.title
                      )
                    }));
                  }}
                  placeholder="예: jeongmin"
                  value={page.publishName ?? ""}
                />
              </label>
              <div className="grid gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs leading-6 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  게시 후 공개 주소
                </span>
                <code className="break-all rounded-sm bg-white px-2 py-1 text-[11px] text-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
                  https://studio-archive.onrender.com{nextPublicPath}
                </code>
                {page.publishedPublicSlug ? (
                  <span>
                    현재 게시 주소:{" "}
                    <Link
                      className="font-medium text-emerald-700 underline underline-offset-4 dark:text-emerald-300"
                      href={publishedPublicPath}
                      target="_blank"
                    >
                      /{page.publishedPublicSlug}
                    </Link>
                  </span>
                ) : (
                  <span>아직 게시된 공개 주소가 없습니다.</span>
                )}
              </div>
            </section>

            {selectedSection ? (
              <SectionInspector
                categories={Array.from(
                  new Set(projects.map((project) => project.category))
                )}
                onChange={updateSelectedSection}
                onDelete={deleteSelectedSection}
                onDuplicate={duplicateSelectedSection}
                onClipboardImageUpload={handleClipboardImageUpload}
                onImagePaste={handleImagePaste}
                onImageUpload={handleImageUpload}
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
              <div data-builder-block-inspector={selectedBlock.id}>
                <BlockInspector
                  block={selectedBlock}
                  onChange={updateSelectedBlock}
                  onClipboardImageUpload={handleClipboardImageUpload}
                  onImagePaste={handleImagePaste}
                  onImageUpload={handleImageUpload}
                />
              </div>
            ) : null}
          </div>
        </aside>
        ) : null}
      </div>
      <CommandBar
        commandMatches={commandMatches}
        commandValue={commandValue}
        isAddMenuOpen={isAddMenuOpen}
        isCommandOpen={isCommandOpen}
        onCommandFocus={() => {
          if (commandValue.trimStart().startsWith("/")) {
            setIsCommandOpen(true);
          }
        }}
        onCommandKeyDown={handleCommandKeyDown}
        onCommandValueChange={handleCommandValueChange}
        onSelectOption={runInsertOption}
        onToggleAddMenu={() => {
          setIsAddMenuOpen((current) => !current);
          setIsCommandOpen(false);
        }}
        selectedCommandIndex={selectedCommandIndex}
      />
    </div>
  );
}

type CommandBarProps = {
  commandMatches: InsertOption[];
  commandValue: string;
  isAddMenuOpen: boolean;
  isCommandOpen: boolean;
  selectedCommandIndex: number;
  onCommandFocus: () => void;
  onCommandKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onCommandValueChange: (value: string) => void;
  onSelectOption: (option: InsertOption) => void;
  onToggleAddMenu: () => void;
};

function CommandBar({
  commandMatches,
  commandValue,
  isAddMenuOpen,
  isCommandOpen,
  selectedCommandIndex,
  onCommandFocus,
  onCommandKeyDown,
  onCommandValueChange,
  onSelectOption,
  onToggleAddMenu
}: CommandBarProps) {
  return (
    <div className="ipad-fixed-command-bar pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-3 sm:px-4">
      <div className="pointer-events-auto w-full max-w-[720px]">
        {isAddMenuOpen ? (
          <div className="mb-2 max-h-[min(60vh,520px)] overflow-y-auto rounded-md border border-neutral-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
            <div className="grid gap-4 md:grid-cols-3">
              {addMenuGroups.map((group) => (
                <section className="min-w-0" key={group.label}>
                  <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    {group.label}
                  </h2>
                  <div className="mt-2 grid gap-1.5">
                    {group.items.map((option) => (
                      <button
                        className="rounded-md px-2 py-2 text-left text-sm transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-neutral-900"
                        key={option.id}
                        onClick={() => onSelectOption(option)}
                        type="button"
                      >
                        <span className="block font-medium text-neutral-950 dark:text-neutral-50">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-neutral-500">
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}

        {isCommandOpen ? (
          <div className="mb-2 max-h-80 overflow-y-auto rounded-md border border-neutral-200 bg-white/95 p-2 shadow-2xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
            {commandMatches.length > 0 ? (
              <div className="grid gap-1">
                {commandMatches.map((option, index) => {
                  const active = index === selectedCommandIndex;

                  return (
                    <button
                      className={`grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                        active
                          ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                          : "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900"
                      }`}
                      key={option.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onSelectOption(option)}
                      type="button"
                    >
                      <span
                        className={`font-mono text-xs ${
                          active
                            ? "text-white/80 dark:text-neutral-600"
                            : "text-neutral-500"
                        }`}
                      >
                        {option.command}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {option.label}
                        </span>
                        <span
                          className={`block truncate text-xs ${
                            active
                              ? "text-white/70 dark:text-neutral-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {option.description}
                        </span>
                      </span>
                      <span
                        className={`rounded-sm border px-1.5 py-0.5 text-[11px] ${
                          active
                            ? "border-white/30 text-white/80 dark:border-neutral-300 dark:text-neutral-600"
                            : "border-neutral-200 text-neutral-500 dark:border-neutral-800"
                        }`}
                      >
                        {option.kind === "block" ? "블록" : "섹션"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-2 text-sm text-neutral-500">
                맞는 명령어가 없습니다.
              </p>
            )}
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white/90 p-2 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <input
            className="min-h-10 flex-1 rounded-md border border-transparent bg-transparent px-3 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-neutral-50 dark:focus:border-neutral-700"
            onChange={(event) => onCommandValueChange(event.target.value)}
            onFocus={onCommandFocus}
            onKeyDown={onCommandKeyDown}
            placeholder="/ 입력으로 블록 추가"
            value={commandValue}
          />
          <button
            aria-expanded={isAddMenuOpen}
            aria-label="블록과 섹션 추가"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-950 text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-700 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200"
            onClick={onToggleAddMenu}
            type="button"
          >
            <Plus aria-hidden size={18} />
          </button>
        </div>
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
  onClipboardImageUpload: (onUploaded: (url: string) => void) => void;
  onImagePaste: (
    onUploaded: (url: string) => void,
    event: ClipboardEvent<HTMLInputElement>
  ) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
};

function SectionInspector({
  section,
  categories,
  onChange,
  onDelete,
  onDuplicate,
  onClipboardImageUpload,
  onImagePaste,
  onImageUpload
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
      <div className="grid gap-2">
        <label className={labelClass}>
          배경 이미지
          <input
            className={inputClass}
            onChange={(event) =>
              updateSettings({ backgroundImage: event.target.value })
            }
            placeholder="/images/cover.jpg 또는 https://..."
            onPaste={(event) =>
              onImagePaste(
                (url) => updateSettings({ backgroundImage: url }),
                event
              )
            }
            value={section.settings.backgroundImage ?? ""}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <UploadButton
            onClipboardImageUpload={onClipboardImageUpload}
            onImageUpload={onImageUpload}
            onUploaded={(url) => updateSettings({ backgroundImage: url })}
          />
          {section.settings.backgroundImage ? (
            <button
              className={buttonClass}
              onClick={() => updateSettings({ backgroundImage: "" })}
              type="button"
            >
              이미지 지우기
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          이미지 위치
          <select
            className={inputClass}
            onChange={(event) =>
              updateSettings({
                backgroundImagePosition:
                  event.target
                    .value as BuilderSectionSettings["backgroundImagePosition"]
              })
            }
            value={section.settings.backgroundImagePosition ?? "center"}
          >
            <option value="center">가운데</option>
            <option value="top">위</option>
            <option value="bottom">아래</option>
            <option value="left">왼쪽</option>
            <option value="right">오른쪽</option>
          </select>
        </label>
        <label className={labelClass}>
          이미지 채우기
          <select
            className={inputClass}
            onChange={(event) =>
              updateSettings({
                backgroundImageSize:
                  event.target.value as BuilderSectionSettings["backgroundImageSize"]
              })
            }
            value={section.settings.backgroundImageSize ?? "cover"}
          >
            <option value="cover">꽉 채우기</option>
            <option value="contain">전체 보이기</option>
          </select>
        </label>
      </div>
      <label className={labelClass}>
        이미지 톤
        <select
          className={inputClass}
          onChange={(event) =>
            updateSettings({
              backgroundOverlay:
                event.target.value as BuilderSectionSettings["backgroundOverlay"]
            })
          }
          value={section.settings.backgroundOverlay ?? "none"}
        >
          <option value="none">원본</option>
          <option value="dark">어둡게</option>
          <option value="light">밝게</option>
        </select>
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
  onClipboardImageUpload: (onUploaded: (url: string) => void) => void;
  onImagePaste: (
    onUploaded: (url: string) => void,
    event: ClipboardEvent<HTMLInputElement>
  ) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
};

function BlockInspector({
  block,
  onChange,
  onClipboardImageUpload,
  onImagePaste,
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
            onClipboardImageUpload={onClipboardImageUpload}
            onImagePaste={onImagePaste}
            onImageUpload={onImageUpload}
          />
    </section>
  );
}

type BlockFieldsProps = {
  block: BuilderBlock;
  onChange: (block: BuilderBlock) => void;
  onClipboardImageUpload: (onUploaded: (url: string) => void) => void;
  onImagePaste: (
    onUploaded: (url: string) => void,
    event: ClipboardEvent<HTMLInputElement>
  ) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
};

function UploadButton({
  onClipboardImageUpload,
  onUploaded,
  onImageUpload
}: {
  onClipboardImageUpload: (onUploaded: (url: string) => void) => void;
  onUploaded: (url: string) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
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
      <button
        className={buttonClass}
        onClick={() => onClipboardImageUpload(onUploaded)}
        type="button"
      >
        <Clipboard aria-hidden size={15} />
        클립보드 붙여넣기
      </button>
    </div>
  );
}

type NestedBuilderBlockListEditorProps = {
  blocks: BuilderBlock[];
  onChange: (blocks: BuilderBlock[]) => void;
  onClipboardImageUpload: (onUploaded: (url: string) => void) => void;
  onImagePaste: (
    onUploaded: (url: string) => void,
    event: ClipboardEvent<HTMLInputElement>
  ) => void;
  onImageUpload: (onUploaded: (url: string) => void, file?: File) => void;
};

function NestedBuilderBlockListEditor({
  blocks,
  onChange,
  onClipboardImageUpload,
  onImagePaste,
  onImageUpload
}: NestedBuilderBlockListEditorProps) {
  const sortedBlocks = blocks.slice().sort((a, b) => a.order - b.order);

  const updateBlock = (block: BuilderBlock) => {
    onChange(
      orderItems(
        sortedBlocks.map((item) => (item.id === block.id ? block : item))
      )
    );
  };

  const removeBlock = (blockId: string) => {
    onChange(orderItems(sortedBlocks.filter((block) => block.id !== blockId)));
  };

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    const index = sortedBlocks.findIndex((block) => block.id === blockId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= sortedBlocks.length) {
      return;
    }

    const nextBlocks = [...sortedBlocks];
    const [currentBlock] = nextBlocks.splice(index, 1);
    nextBlocks.splice(targetIndex, 0, currentBlock);
    onChange(orderItems(nextBlocks));
  };

  const addBlock = (type: BuilderBlockType) => {
    onChange(orderItems([...sortedBlocks, createBlock(type)]));
  };

  return (
    <div className="grid gap-3">
      {sortedBlocks.map((block, index) => (
        <section
          className="grid gap-3 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
          key={block.id}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
                {blockLabels[block.type]}
              </p>
              <p className="text-xs text-neutral-500">탭 블록 {index + 1}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={iconButtonClass}
                disabled={index === 0}
                onClick={() => moveBlock(block.id, -1)}
                type="button"
              >
                위
              </button>
              <button
                className={iconButtonClass}
                disabled={index === sortedBlocks.length - 1}
                onClick={() => moveBlock(block.id, 1)}
                type="button"
              >
                아래
              </button>
              <button
                aria-label="블록 삭제"
                className={iconButtonClass}
                onClick={() => removeBlock(block.id)}
                type="button"
              >
                <Trash2 aria-hidden size={15} />
              </button>
            </div>
          </div>
          <BlockFields
            block={block}
            onChange={updateBlock}
            onClipboardImageUpload={onClipboardImageUpload}
            onImagePaste={onImagePaste}
            onImageUpload={onImageUpload}
          />
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        {baseBlockInsertOptions.map((option) => (
          <button
            className={buttonClass}
            key={option.id}
            onClick={() => addBlock(option.create().type)}
            type="button"
          >
            <Plus aria-hidden size={15} />
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextStyleFields({
  block,
  onChange
}: {
  block: TextStyleBlock;
  onChange: (block: TextStyleBlock) => void;
}) {
  const updateSettings = (settings: Partial<BuilderTextSettings>) => {
    onChange({
      ...block,
      settings: {
        ...block.settings,
        ...settings
      } as TextStyleBlock["settings"]
    } as TextStyleBlock);
  };

  return (
    <div className="grid gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
        글자 스타일
      </p>
      <label className={labelClass}>
        폰트
        <select
          className={inputClass}
          onChange={(event) =>
            updateSettings({
              fontFamily:
                event.target.value === "auto"
                  ? undefined
                  : (event.target.value as BuilderTextFont)
            })
          }
          value={block.settings.fontFamily ?? "auto"}
        >
          {textFontOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        크기(pt)
        <input
          className={inputClass}
          max={160}
          min={6}
          onChange={(event) =>
            updateSettings({
              fontSize: undefined,
              fontSizePt: event.target.value
                ? Number(event.target.value)
                : undefined
            })
          }
          placeholder="기본"
          type="number"
          value={
            block.settings.fontSizePt ??
            (block.settings.fontSize
              ? legacyTextSizePt[block.settings.fontSize]
              : "")
          }
        />
      </label>
      <label className={labelClass}>
        글씨 색
        <div className="grid gap-2 sm:grid-cols-[48px_1fr]">
          <input
            aria-label="글씨 색 선택"
            className="h-10 w-12 cursor-pointer rounded-md border border-neutral-200 bg-transparent p-1 dark:border-neutral-800"
            onChange={(event) => updateSettings({ color: event.target.value })}
            type="color"
            value={
              /^#[0-9a-fA-F]{6}$/.test(block.settings.color ?? "")
                ? block.settings.color
                : "#111111"
            }
          />
          <input
            className={inputClass}
            onChange={(event) =>
              updateSettings({ color: event.target.value || undefined })
            }
            placeholder="#111111"
            value={block.settings.color ?? ""}
          />
        </div>
      </label>
    </div>
  );
}

function BlockFields({
  block,
  onChange,
  onClipboardImageUpload,
  onImagePaste,
  onImageUpload
}: BlockFieldsProps) {
  const textStyleFields = isTextStyleBlock(block) ? (
    <TextStyleFields block={block} onChange={(nextBlock) => onChange(nextBlock)} />
  ) : null;

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
                    level: Number(event.target.value) as 1 | 2 | 3 | 4
                  }
                })
              }
              value={block.settings.level ?? 2}
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
            </select>
          </label>
          {textStyleFields}
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
          {textStyleFields}
        </>
      );
    case "bulletList":
    case "numberedList":
      return (
        <>
          <label className={labelClass}>
            목록 항목
            <textarea
              className={textareaClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  content: {
                    items: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  }
                })
              }
              placeholder="한 줄에 항목 하나씩 입력"
              value={block.content.items.join("\n")}
            />
          </label>
          {textStyleFields}
        </>
      );
    case "tabs":
      return (
        <div className="grid gap-4">
          <label className={labelClass}>
            탭 스타일
            <select
              className={inputClass}
              onChange={(event) =>
                onChange({
                  ...block,
                  settings: {
                    ...block.settings,
                    style: event.target.value as "soft" | "line"
                  }
                })
              }
              value={block.settings.style ?? "soft"}
            >
              <option value="soft">부드러운 버튼형</option>
              <option value="line">밑줄형</option>
            </select>
          </label>
          {block.content.tabs.map((tab, index) => (
            <div
              className="grid gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
              key={tab.id}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  탭 {index + 1}
                </p>
                {block.content.tabs.length > 1 ? (
                  <button
                    className={iconButtonClass}
                    onClick={() => {
                      const tabs = block.content.tabs.filter(
                        (item) => item.id !== tab.id
                      );
                      onChange({
                        ...block,
                        content: { tabs },
                        settings: {
                          ...block.settings,
                          activeTabId:
                            block.settings.activeTabId === tab.id
                              ? tabs[0]?.id
                              : block.settings.activeTabId
                        }
                      });
                    }}
                    type="button"
                  >
                    <Trash2 aria-hidden size={15} />
                  </button>
                ) : null}
              </div>
              <label className={labelClass}>
                탭 이름
                <input
                  className={inputClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      content: {
                        tabs: block.content.tabs.map((item) =>
                          item.id === tab.id
                            ? { ...item, label: event.target.value }
                            : item
                        )
                      }
                    })
                  }
                  value={tab.label}
                />
              </label>
              <label className={labelClass}>
                내용
                <textarea
                  className={textareaClass}
                  onChange={(event) =>
                    onChange({
                      ...block,
                      content: {
                        tabs: block.content.tabs.map((item) =>
                          item.id === tab.id
                            ? { ...item, text: event.target.value }
                            : item
                        )
                      }
                    })
                  }
                  placeholder="탭 안에 보여줄 내용을 입력"
                  value={tab.text}
                />
              </label>
              <div className="grid gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  탭 내부 블록
                </p>
                <NestedBuilderBlockListEditor
                  blocks={tab.blocks ?? []}
                  onChange={(blocks) =>
                    onChange({
                      ...block,
                      content: {
                        tabs: block.content.tabs.map((item) =>
                          item.id === tab.id ? { ...item, blocks } : item
                        )
                      }
                    })
                  }
                  onClipboardImageUpload={onClipboardImageUpload}
                  onImagePaste={onImagePaste}
                  onImageUpload={onImageUpload}
                />
              </div>
            </div>
          ))}
          <button
            className={buttonClass}
            onClick={() => {
              const tab = {
                id: createId("tab"),
                blocks: [],
                label: `탭 ${block.content.tabs.length + 1}`,
                text: ""
              };
              onChange({
                ...block,
                content: { tabs: [...block.content.tabs, tab] },
                settings: { ...block.settings, activeTabId: tab.id }
              });
            }}
            type="button"
          >
            <Plus aria-hidden size={15} />
            탭 추가
          </button>
        </div>
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
              onPaste={(event) =>
                onImagePaste(
                  (url) =>
                    onChange({
                      ...block,
                      content: { ...block.content, src: url }
                    }),
                  event
                )
              }
              value={block.content.src}
            />
          </label>
          <UploadButton
            onClipboardImageUpload={onClipboardImageUpload}
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
                  onPaste={(event) =>
                    onImagePaste(
                      (url) =>
                        onChange({
                          ...block,
                          content: {
                            images: block.content.images.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, src: url } : item
                            )
                          }
                        }),
                      event
                    )
                  }
                  value={image.src}
                />
              </label>
              <UploadButton
                onClipboardImageUpload={onClipboardImageUpload}
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
          {textStyleFields}
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
          {textStyleFields}
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
          {textStyleFields}
        </>
      );
  }
}
