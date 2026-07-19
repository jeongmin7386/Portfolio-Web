import {
  BUILDER_BLOCK_TYPES,
  BUILDER_SECTION_TYPES,
  type BuilderBlock,
  type BuilderPage,
  type BuilderSection,
  type Note,
  type Project,
  type ProjectBlock,
  type StudioArchiveContent
} from "@/lib/types";

export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentValidationError";
  }
}

const maxJsonBytes = 2 * 1024 * 1024;
const maxTextLength = 20_000;
const maxItems = 200;
const maxBlocks = 500;
const maxDepth = 4;
const allowedBuilderBlockTypes = new Set<string>(BUILDER_BLOCK_TYPES);
const allowedBuilderSectionTypes = new Set<string>(BUILDER_SECTION_TYPES);
const allowedProjectBlockTypes = new Set<string>([
  "heading",
  "paragraph",
  "bulletList",
  "numberedList",
  "tabs",
  "image",
  "imageGrid",
  "quote",
  "button",
  "divider",
  "embed",
  "spacer",
  "twoColumn",
  "stats",
  "process",
  "result"
]);
function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContentValidationError(`${label} 형식이 올바르지 않습니다.`);
  }
}

function assertJsonSize(value: unknown, label: string) {
  const size = Buffer.byteLength(JSON.stringify(value), "utf8");

  if (size > maxJsonBytes) {
    throw new ContentValidationError(`${label} 데이터가 너무 큽니다.`);
  }
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.slice(0, maxTextLength) : fallback;
}

function stringList(value: unknown, limit = maxItems) {
  return Array.isArray(value)
    ? value
        .slice(0, limit)
        .map((item) => stringValue(item).trim())
        .filter(Boolean)
    : [];
}

function numberInRange(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

function isSafeColor(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return true;
  }

  const color = value.trim();
  const safeColorKeywords = new Set(["transparent", "currentcolor"]);

  return (
    safeColorKeywords.has(color.toLowerCase()) ||
    /^#[0-9a-f]{3,8}$/i.test(color) ||
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(color)
  );
}

function isSafeUrl(value: unknown, options: { embed?: boolean } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    return true;
  }

  const url = value.trim();

  if (url.startsWith("/") && !url.startsWith("//")) {
    return !options.embed;
  }

  if (url.startsWith("mailto:")) {
    return !options.embed;
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  if (!options.embed) {
    return true;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  return true;
}

function assertTextSettings(settings: Record<string, unknown>, label: string) {
  if (!isSafeColor(settings.color)) {
    throw new ContentValidationError(`${label}의 글자 색상 값이 올바르지 않습니다.`);
  }

  if ("fontSizePt" in settings) {
    settings.fontSizePt = numberInRange(settings.fontSizePt, 6, 160, 16);
  }

  if ("lineHeight" in settings) {
    settings.lineHeight = numberInRange(settings.lineHeight, 0.8, 3, 1.5);
  }
}

function assertBuilderBlock(
  block: unknown,
  ids: Set<string>,
  stats: { blocks: number },
  depth: number
) {
  assertObject(block, "블록");

  const id = stringValue(block.id).trim();
  const type = stringValue(block.type);

  if (!id) {
    throw new ContentValidationError("블록 ID가 비어 있습니다.");
  }

  if (ids.has(id)) {
    throw new ContentValidationError("중복된 블록 ID가 있습니다.");
  }

  if (!allowedBuilderBlockTypes.has(type)) {
    throw new ContentValidationError(`지원하지 않는 블록 타입입니다: ${type}`);
  }

  ids.add(id);

  if (++stats.blocks > maxBlocks) {
    throw new ContentValidationError("블록 수가 너무 많습니다.");
  }

  const blockContent = block.content ?? {};
  const blockSettings = block.settings ?? {};

  assertObject(blockContent, "블록 내용");
  assertObject(blockSettings, "블록 설정");
  assertTextSettings(blockSettings, "블록");

  if (type === "button" && !isSafeUrl(blockContent.href)) {
    throw new ContentValidationError("버튼 링크가 올바르지 않습니다.");
  }

  if (type === "image" && !isSafeUrl(blockContent.src)) {
    throw new ContentValidationError("이미지 주소가 올바르지 않습니다.");
  }

  if (type === "gallery") {
    const images = blockContent.images;

    if (Array.isArray(images)) {
      for (const image of images) {
        assertObject(image, "갤러리 이미지");

        if (!isSafeUrl(image.src)) {
          throw new ContentValidationError("갤러리 이미지 주소가 올바르지 않습니다.");
        }
      }
    }
  }

  if (type === "embed" && !isSafeUrl(blockContent.url, { embed: true })) {
    throw new ContentValidationError("허용되지 않는 임베드 주소입니다.");
  }

  if (type === "tabs") {
    if (depth >= maxDepth) {
      throw new ContentValidationError("탭 중첩이 너무 깊습니다.");
    }

    const tabs = blockContent.tabs;

    if (!Array.isArray(tabs)) {
      throw new ContentValidationError("탭 블록 데이터가 올바르지 않습니다.");
    }

    for (const tab of tabs.slice(0, 20)) {
      assertObject(tab, "탭");
      const blocks = Array.isArray(tab.blocks) ? tab.blocks : [];

      for (const childBlock of blocks) {
        assertBuilderBlock(childBlock, ids, stats, depth + 1);
      }
    }
  }
}

function normalizeBuilderBlocks(blocks: BuilderBlock[]) {
  return blocks
    .map((block, index) => ({
      ...block,
      order: Number.isFinite(block.order) ? block.order : index
    }))
    .sort((a, b) => a.order - b.order)
    .map((block, index) => ({ ...block, order: index }));
}

function normalizeBuilderSections(sections: BuilderSection[]) {
  return sections
    .map((section, index) => ({
      ...section,
      order: Number.isFinite(section.order) ? section.order : index,
      settings: section.settings ?? {},
      blocks: normalizeBuilderBlocks(section.blocks ?? [])
    }))
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index }));
}

export function validateBuilderPage(value: unknown): BuilderPage {
  assertJsonSize(value, "페이지");
  assertObject(value, "페이지");

  if (
    typeof value.id !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.title !== "string" ||
    !Array.isArray(value.sections)
  ) {
    throw new ContentValidationError("페이지 필수 필드가 올바르지 않습니다.");
  }

  const sectionIds = new Set<string>();
  const blockIds = new Set<string>();
  const stats = { blocks: 0 };

  for (const section of value.sections) {
    assertObject(section, "섹션");

    const sectionId = stringValue(section.id).trim();
    const sectionType = stringValue(section.type);

    if (!sectionId) {
      throw new ContentValidationError("섹션 ID가 비어 있습니다.");
    }

    if (sectionIds.has(sectionId)) {
      throw new ContentValidationError("중복된 섹션 ID가 있습니다.");
    }

    if (!allowedBuilderSectionTypes.has(sectionType)) {
      throw new ContentValidationError(`지원하지 않는 섹션 타입입니다: ${sectionType}`);
    }

    const sectionSettings = section.settings ?? {};
    assertObject(sectionSettings, "섹션 설정");

    if (!isSafeColor(sectionSettings.backgroundColor) || !isSafeColor(sectionSettings.textColor)) {
      throw new ContentValidationError("섹션 색상 값이 올바르지 않습니다.");
    }

    if (!isSafeUrl(sectionSettings.backgroundImage)) {
      throw new ContentValidationError("섹션 배경 이미지 주소가 올바르지 않습니다.");
    }

    if (!Array.isArray(section.blocks)) {
      throw new ContentValidationError("섹션 블록 데이터가 올바르지 않습니다.");
    }

    for (const block of section.blocks) {
      assertBuilderBlock(block, blockIds, stats, 0);
    }

    sectionIds.add(sectionId);
  }

  return {
    ...(value as BuilderPage),
    sections: normalizeBuilderSections(value.sections as BuilderSection[])
  };
}

function assertProjectBlock(block: unknown, stats: { blocks: number }, depth: number) {
  assertObject(block, "프로젝트 블록");
  const type = stringValue(block.type);

  if (!allowedProjectBlockTypes.has(type)) {
    throw new ContentValidationError(`지원하지 않는 프로젝트 블록 타입입니다: ${type}`);
  }

  if (++stats.blocks > maxBlocks) {
    throw new ContentValidationError("프로젝트 블록 수가 너무 많습니다.");
  }

  assertTextSettings(block, "프로젝트 블록");

  if (type === "button" && !isSafeUrl(block.href)) {
    throw new ContentValidationError("프로젝트 버튼 링크가 올바르지 않습니다.");
  }

  if (type === "image" && !isSafeUrl(block.src)) {
    throw new ContentValidationError("프로젝트 이미지 주소가 올바르지 않습니다.");
  }

  if (type === "imageGrid" && Array.isArray(block.images)) {
    for (const image of block.images) {
      assertObject(image, "프로젝트 이미지");

      if (!isSafeUrl(image.src)) {
        throw new ContentValidationError("프로젝트 이미지 주소가 올바르지 않습니다.");
      }
    }
  }

  if (type === "embed" && !isSafeUrl(block.url, { embed: true })) {
    throw new ContentValidationError("허용되지 않는 프로젝트 임베드 주소입니다.");
  }

  if (type === "twoColumn") {
    const left = Array.isArray(block.left) ? block.left : [];
    const right = Array.isArray(block.right) ? block.right : [];

    for (const childBlock of [...left, ...right]) {
      assertProjectBlock(childBlock, stats, depth + 1);
    }
  }

  if (type === "tabs") {
    if (depth >= maxDepth) {
      throw new ContentValidationError("프로젝트 탭 중첩이 너무 깊습니다.");
    }

    const tabs = Array.isArray(block.tabs) ? block.tabs : [];

    for (const tab of tabs.slice(0, 20)) {
      assertObject(tab, "프로젝트 탭");

      for (const childBlock of Array.isArray(tab.blocks) ? tab.blocks : []) {
        assertProjectBlock(childBlock, stats, depth + 1);
      }
    }
  }
}

function validateProject(project: unknown): Project {
  assertObject(project, "프로젝트");

  if (
    typeof project.slug !== "string" ||
    typeof project.title !== "string" ||
    typeof project.category !== "string" ||
    !Array.isArray(project.blocks)
  ) {
    throw new ContentValidationError("프로젝트 필수 필드가 올바르지 않습니다.");
  }

  if (!isSafeUrl(project.coverImage)) {
    throw new ContentValidationError("프로젝트 표지 이미지 주소가 올바르지 않습니다.");
  }

  if (!isSafeUrl(project.link)) {
    throw new ContentValidationError("프로젝트 링크가 올바르지 않습니다.");
  }

  const stats = { blocks: 0 };

  for (const block of project.blocks) {
    assertProjectBlock(block, stats, 0);
  }

  return {
    ...(project as Project),
    tags: stringList(project.tags),
    tools: stringList(project.tools),
    deliverables: stringList(project.deliverables),
    blocks: project.blocks as ProjectBlock[]
  };
}

function validateNote(note: unknown): Note {
  assertObject(note, "아카이브 노트");

  if (
    typeof note.slug !== "string" ||
    typeof note.title !== "string" ||
    typeof note.date !== "string"
  ) {
    throw new ContentValidationError("아카이브 노트 필수 필드가 올바르지 않습니다.");
  }

  return {
    ...(note as Note),
    tags: stringList(note.tags)
  };
}

export function validateStudioArchiveContent(value: unknown): StudioArchiveContent {
  assertJsonSize(value, "콘텐츠");
  assertObject(value, "콘텐츠");

  if (
    !Array.isArray(value.categories) ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.notes)
  ) {
    throw new ContentValidationError("콘텐츠 필수 필드가 올바르지 않습니다.");
  }

  return {
    categories: stringList(value.categories),
    projects: value.projects.slice(0, 200).map(validateProject),
    notes: value.notes.slice(0, 500).map(validateNote),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
  };
}

export function assertSupportedStudioProjectImport(value: unknown) {
  assertJsonSize(value, "가져오기 파일");
}
