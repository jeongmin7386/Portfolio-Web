import fs from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { Pool, type PoolConfig } from "pg";

import {
  type BuilderBlock,
  type BuilderPage,
  type BuilderSection,
  PROJECT_CATEGORIES,
  type Note,
  type Project,
  type StudioArchiveContent
} from "@/lib/types";

export type ContentStorageMode = "database" | "file";
export type BuilderPageKind = "home" | "archive";

const contentRoot = path.join(process.cwd(), "content");
const projectsRoot = path.join(contentRoot, "projects");
const notesRoot = path.join(contentRoot, "notes");
const contentRowId = "studio-archive";
export const defaultContentOwnerKey = "owner";
export const publicPortfolioSuffix = "portfoilo";

const dataRoot = process.env.STUDIO_ARCHIVE_DATA_DIR
  ? path.resolve(process.env.STUDIO_ARCHIVE_DATA_DIR)
  : path.join(process.cwd(), "data");
const editableContentPath = path.join(dataRoot, "studio-archive-content.json");
const editablePagePath = path.join(dataRoot, "studio-archive-page-home.json");
const databaseUrl =
  process.env.STUDIO_ARCHIVE_DATABASE_URL ?? process.env.DATABASE_URL;

let pool: Pool | undefined;
let contentTableReady = false;
let pageTableReady = false;

export type PublishedPortfolio = {
  ownerKey: string;
  page: BuilderPage;
  publicSlug: string;
};

function isAsciiLetterOrNumber(value: string) {
  const code = value.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 97 && code <= 122) ||
    (code >= 65 && code <= 90)
  );
}

function isHangul(value: string) {
  const code = value.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

export function normalizePublicPortfolioName(value: string) {
  const normalized = value.trim().toLowerCase().normalize("NFKC");
  let nextValue = "";

  for (const character of normalized) {
    if (
      isAsciiLetterOrNumber(character) ||
      isHangul(character) ||
      character === "_"
    ) {
      nextValue += character;
      continue;
    }

    if (character === "-" || /\s/.test(character)) {
      nextValue += "-";
    }
  }

  return nextValue.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function getPublicPortfolioSlug(value: string) {
  const normalizedName = normalizePublicPortfolioName(value);
  const name = normalizedName || "my";
  const suffix = `-${publicPortfolioSuffix}`;

  return name.endsWith(suffix) ? name : `${name}${suffix}`;
}

function getOwnerKeyFromPageSlug(slug: string) {
  if (slug === "home" || slug === "archive") {
    return defaultContentOwnerKey;
  }

  if (slug.startsWith("user-")) {
    if (slug.endsWith("-home")) {
      return normalizeContentOwnerKey(slug.slice(5, -5));
    }

    if (slug.endsWith("-archive")) {
      return normalizeContentOwnerKey(slug.slice(5, -8));
    }
  }

  return defaultContentOwnerKey;
}

export function normalizeBuilderPageKind(value = "home"): BuilderPageKind {
  return value === "archive" ? "archive" : "home";
}

export function normalizeContentOwnerKey(ownerKey = defaultContentOwnerKey) {
  const normalized = ownerKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || defaultContentOwnerKey;
}

export function getOwnerHomeSlug(ownerKey = defaultContentOwnerKey) {
  const normalizedOwnerKey = normalizeContentOwnerKey(ownerKey);
  return normalizedOwnerKey === defaultContentOwnerKey
    ? "home"
    : `user-${normalizedOwnerKey}-home`;
}

function getOwnerBuilderPageSlug(
  pageKind: BuilderPageKind,
  ownerKey = defaultContentOwnerKey
) {
  const normalizedOwnerKey = normalizeContentOwnerKey(ownerKey);

  if (pageKind === "home") {
    return getOwnerHomeSlug(normalizedOwnerKey);
  }

  return normalizedOwnerKey === defaultContentOwnerKey
    ? "archive"
    : `user-${normalizedOwnerKey}-archive`;
}

function getBuilderPageKindFromSlug(slug: string): BuilderPageKind {
  return slug === "archive" || slug.endsWith("-archive") ? "archive" : "home";
}

function getOwnerPageId(
  pageKind: BuilderPageKind,
  ownerKey = defaultContentOwnerKey
) {
  const normalizedOwnerKey = normalizeContentOwnerKey(ownerKey);
  return normalizedOwnerKey === defaultContentOwnerKey
    ? `page-${pageKind}`
    : `page-${normalizedOwnerKey}-${pageKind}`;
}

function getContentRowId(ownerKey = defaultContentOwnerKey) {
  const normalizedOwnerKey = normalizeContentOwnerKey(ownerKey);
  return normalizedOwnerKey === defaultContentOwnerKey
    ? contentRowId
    : `${contentRowId}:${normalizedOwnerKey}`;
}

function getEditableContentPath(ownerKey = defaultContentOwnerKey) {
  const normalizedOwnerKey = normalizeContentOwnerKey(ownerKey);
  return normalizedOwnerKey === defaultContentOwnerKey
    ? editableContentPath
    : path.join(dataRoot, `studio-archive-content-${normalizedOwnerKey}.json`);
}

function getEditablePagePath(
  pageKind: BuilderPageKind,
  ownerKey = defaultContentOwnerKey
) {
  const normalizedOwnerKey = normalizeContentOwnerKey(ownerKey);

  if (pageKind === "home") {
    return normalizedOwnerKey === defaultContentOwnerKey
      ? editablePagePath
      : path.join(
          dataRoot,
          `studio-archive-page-home-${normalizedOwnerKey}.json`
        );
  }

  return normalizedOwnerKey === defaultContentOwnerKey
    ? path.join(dataRoot, "studio-archive-page-archive.json")
    : path.join(
        dataRoot,
        `studio-archive-page-archive-${normalizedOwnerKey}.json`
      );
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const file = await fs.readFile(filePath, "utf8");
  return JSON.parse(file) as T;
}

async function readJsonDirectory<T>(directory: string): Promise<T[]> {
  const files = await fs.readdir(directory);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  return Promise.all(
    jsonFiles.map((file) => readJsonFile<T>(path.join(directory, file)))
  );
}

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    const firstOrder = Number.isFinite(a.order) ? a.order : undefined;
    const secondOrder = Number.isFinite(b.order) ? b.order : undefined;

    if (firstOrder !== undefined && secondOrder !== undefined) {
      return firstOrder - secondOrder;
    }

    if (firstOrder !== undefined) {
      return -1;
    }

    if (secondOrder !== undefined) {
      return 1;
    }

    const yearDelta = Number(b.year) - Number(a.year);
    return yearDelta || a.title.localeCompare(b.title);
  });
}

function sortNotes(notes: Note[]) {
  return [...notes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function normalizeContent(content: StudioArchiveContent): StudioArchiveContent {
  return {
    categories: Array.from(
      new Set(
        (content.categories?.length
          ? content.categories
          : [...PROJECT_CATEGORIES]
        ).filter(Boolean)
      )
    ),
    projects: sortProjects(content.projects ?? []),
    notes: sortNotes(content.notes ?? []),
    updatedAt: content.updatedAt ?? new Date().toISOString()
  };
}

function sortBuilderBlocks(blocks: BuilderBlock[]) {
  return [...(blocks ?? [])]
    .map((block, index) => ({
      ...block,
      order: Number.isFinite(block.order) ? block.order : index
    }))
    .sort((a, b) => a.order - b.order);
}

function sortBuilderSections(sections: BuilderSection[]) {
  return [...(sections ?? [])]
    .map((section, index) => ({
      ...section,
      order: Number.isFinite(section.order) ? section.order : index,
      settings: section.settings ?? {},
      blocks: sortBuilderBlocks(section.blocks)
    }))
    .sort((a, b) => a.order - b.order);
}

function normalizeBuilderPage(page: BuilderPage): BuilderPage {
  const publishName = page.publishName ?? "";
  const publicSlug =
    page.publicSlug ??
    (publishName ? getPublicPortfolioSlug(publishName) : undefined);

  return {
    ...page,
    seoTitle: page.seoTitle ?? page.title,
    seoDescription: page.seoDescription ?? "",
    publishName,
    publicSlug,
    status: page.status ?? "published",
    sections: sortBuilderSections(page.sections),
    publishedSections: page.publishedSections
      ? sortBuilderSections(page.publishedSections)
      : undefined,
    publishedSeoTitle: page.publishedSeoTitle ?? page.seoTitle ?? page.title,
    publishedSeoDescription:
      page.publishedSeoDescription ?? page.seoDescription ?? "",
    publishedPublicSlug: page.publishedPublicSlug ?? undefined,
    updatedAt: page.updatedAt ?? new Date().toISOString()
  };
}

function getDatabaseSsl(): PoolConfig["ssl"] {
  const sslMode =
    process.env.STUDIO_ARCHIVE_DATABASE_SSL ?? process.env.PGSSLMODE;

  if (sslMode === "disable") {
    return false;
  }

  if (
    sslMode === "require" ||
    databaseUrl?.includes("sslmode=require") ||
    process.env.NODE_ENV === "production"
  ) {
    return {
      rejectUnauthorized: false
    };
  }

  return undefined;
}

function getPool() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  pool ??= new Pool({
    connectionString: databaseUrl,
    ssl: getDatabaseSsl()
  });

  return pool;
}

async function ensureContentTable() {
  if (contentTableReady) {
    return;
  }

  await getPool().query(`
    create table if not exists studio_archive_content (
      id text primary key,
      content jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  contentTableReady = true;
}

async function ensurePageTable() {
  if (pageTableReady) {
    return;
  }

  await getPool().query(`
    create table if not exists studio_archive_pages (
      id text primary key,
      slug text unique not null,
      title text not null,
      seo_title text,
      seo_description text,
      status text not null default 'published',
      sections jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  await getPool().query(`
    alter table studio_archive_pages
      add column if not exists published_sections jsonb,
      add column if not exists published_seo_title text,
      add column if not exists published_seo_description text,
      add column if not exists publish_name text,
      add column if not exists public_slug text,
      add column if not exists published_public_slug text,
      add column if not exists published_at timestamptz
  `);
  await getPool().query(`
    create unique index if not exists studio_archive_pages_published_public_slug_idx
      on studio_archive_pages (published_public_slug)
      where published_public_slug is not null
  `);

  pageTableReady = true;
}

async function getSeedContent(): Promise<StudioArchiveContent> {
  const [projects, notes] = await Promise.all([
    readJsonDirectory<Project>(projectsRoot),
    readJsonDirectory<Note>(notesRoot)
  ]);

  const projectCategories = projects.map((project) => project.category);
  const categories = Array.from(
    new Set([...PROJECT_CATEGORIES, ...projectCategories])
  );

  return normalizeContent({
    categories,
    projects,
    notes,
    updatedAt: new Date().toISOString()
  });
}

function getSeedArchiveBuilderPage(): BuilderPage {
  const page = normalizeBuilderPage({
    id: "page-archive",
    slug: "archive",
    title: "Archive",
    seoTitle: "Archive | Studio Archive",
    seoDescription: "작업 과정과 리서치, 짧은 노트를 모아두는 아카이브입니다.",
    status: "published",
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "section-archive-hero",
        type: "hero",
        order: 0,
        settings: {
          paddingY: "xl",
          maxWidth: "wide",
          align: "left",
          backgroundColor: "transparent"
        },
        blocks: [
          {
            id: "block-archive-eyebrow",
            type: "paragraph",
            order: 0,
            content: {
              text: "Archive"
            },
            settings: {
              width: "narrow",
              align: "left"
            }
          },
          {
            id: "block-archive-title",
            type: "heading",
            order: 1,
            content: {
              text: "작업의 흐름을 기록합니다."
            },
            settings: {
              level: 1,
              align: "left"
            }
          },
          {
            id: "block-archive-description",
            type: "paragraph",
            order: 2,
            content: {
              text:
                "리서치, 참고 자료, 제작 과정에서 남긴 생각을 한곳에 정리합니다."
            },
            settings: {
              width: "content",
              align: "left"
            }
          }
        ]
      },
      {
        id: "section-archive-list",
        type: "archiveList",
        order: 1,
        settings: {
          paddingY: "lg",
          maxWidth: "wide",
          gap: "md"
        },
        blocks: [
          {
            id: "block-archive-list-heading",
            type: "heading",
            order: 0,
            content: {
              text: "노트"
            },
            settings: {
              level: 2,
              align: "left"
            }
          }
        ]
      }
    ]
  });

  return {
    ...page,
    publishedSections: page.sections,
    publishedSeoTitle: page.seoTitle,
    publishedSeoDescription: page.seoDescription,
    publishedAt: page.updatedAt
  };
}

async function getSeedBuilderPage(
  pageKind: BuilderPageKind = "home"
): Promise<BuilderPage> {
  if (pageKind === "archive") {
    return getSeedArchiveBuilderPage();
  }

  const content = await readFileContent();
  const page = normalizeBuilderPage({
    id: "page-home",
    slug: "home",
    title: "홈",
    seoTitle: "Studio Archive",
    seoDescription:
      "작업의 맥락과 이미지를 차분하게 담는 개인 포트폴리오.",
    status: "published",
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: "section-hero",
        type: "hero",
        order: 0,
        settings: {
          paddingY: "xl",
          maxWidth: "wide",
          align: "left",
          backgroundColor: "transparent"
        },
        blocks: [
          {
            id: "block-hero-eyebrow",
            type: "paragraph",
            order: 0,
            content: {
              text: "Studio Archive"
            },
            settings: {
              width: "narrow",
              align: "left"
            }
          },
          {
            id: "block-hero-heading",
            type: "heading",
            order: 1,
            content: {
              text: "작업의 맥락과 이미지를 차분하게 담는 포트폴리오."
            },
            settings: {
              level: 1,
              align: "left"
            }
          },
          {
            id: "block-hero-body",
            type: "paragraph",
            order: 2,
            content: {
              text:
                "브랜드, 디지털 제품, 에디토리얼 시스템을 다룹니다. 유연한 작업 노트와 정제된 케이스 스터디를 한곳에 모았습니다."
            },
            settings: {
              width: "content",
              align: "left"
            }
          },
          {
            id: "block-hero-button",
            type: "button",
            order: 3,
            content: {
              label: "작업 보기",
              href: "/projects"
            },
            settings: {
              variant: "primary",
              align: "left"
            }
          }
        ]
      },
      {
        id: "section-projects",
        type: "projectGrid",
        order: 1,
        settings: {
          paddingY: "lg",
          maxWidth: "wide",
          columns: 3,
          gap: "md",
          cardStyle: "none",
          gridStyle: "cards",
          projectSource: "featured",
          projectLimit: 6
        },
        blocks: [
          {
            id: "block-project-heading",
            type: "heading",
            order: 0,
            content: {
              text: "선별한 프로젝트"
            },
            settings: {
              level: 2,
              align: "left"
            }
          },
          {
            id: "block-project-body",
            type: "paragraph",
            order: 1,
            content: {
              text: "브랜딩, 제품, 편집, 모션 작업을 간결하게 묶었습니다."
            },
            settings: {
              width: "content",
              align: "left"
            }
          }
        ]
      },
      {
        id: "section-archive",
        type: "archiveList",
        order: 2,
        settings: {
          paddingY: "lg",
          maxWidth: "wide",
          gap: "md"
        },
        blocks: [
          {
            id: "block-archive-heading",
            type: "heading",
            order: 0,
            content: {
              text: "최근 노트"
            },
            settings: {
              level: 2,
              align: "left"
            }
          }
        ]
      },
      {
        id: "section-contact",
        type: "contact",
        order: 3,
        settings: {
          paddingY: "lg",
          maxWidth: "content",
          align: "left"
        },
        blocks: [
          {
            id: "block-contact-heading",
            type: "heading",
            order: 0,
            content: {
              text: "함께 만들 이야기가 있다면"
            },
            settings: {
              level: 2,
              align: "left"
            }
          },
          {
            id: "block-contact-body",
            type: "paragraph",
            order: 1,
            content: {
              text:
                content.projects.length > 0
                  ? "작업 의뢰와 협업 제안을 편하게 보내주세요."
                  : "프로젝트를 추가하면 이 공간에 더 풍부한 맥락을 담을 수 있습니다."
            },
            settings: {
              width: "content",
              align: "left"
            }
          },
          {
            id: "block-contact-button",
            type: "button",
            order: 2,
            content: {
              label: "연락하기",
              href: "mailto:hello@example.com"
            },
            settings: {
              variant: "secondary",
              align: "left"
            }
          }
        ]
      }
    ]
  });

  return {
    ...page,
    publishedSections: page.sections,
    publishedSeoTitle: page.seoTitle,
    publishedSeoDescription: page.seoDescription,
    publishedAt: page.updatedAt
  };
}

async function readFileContent(
  ownerKey = defaultContentOwnerKey
): Promise<StudioArchiveContent> {
  try {
    const content =
      await readJsonFile<StudioArchiveContent>(getEditableContentPath(ownerKey));
    return normalizeContent(content);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return getSeedContent();
    }

    throw error;
  }
}

async function saveFileContent(
  content: StudioArchiveContent,
  ownerKey = defaultContentOwnerKey
): Promise<StudioArchiveContent> {
  const nextContent = normalizeContent({
    ...content,
    updatedAt: new Date().toISOString()
  });

  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(
    getEditableContentPath(ownerKey),
    JSON.stringify(nextContent, null, 2),
    "utf8"
  );

  return nextContent;
}

async function readDatabaseContent(
  ownerKey = defaultContentOwnerKey
): Promise<StudioArchiveContent> {
  await ensureContentTable();
  const rowId = getContentRowId(ownerKey);

  const result = await getPool().query<{ content: StudioArchiveContent }>(
    "select content from studio_archive_content where id = $1",
    [rowId]
  );

  const content = result.rows[0]?.content;

  if (content) {
    return normalizeContent(content);
  }

  const seedContent = await readFileContent(ownerKey);
  return saveDatabaseContent(seedContent, ownerKey);
}

async function saveDatabaseContent(
  content: StudioArchiveContent,
  ownerKey = defaultContentOwnerKey
): Promise<StudioArchiveContent> {
  await ensureContentTable();
  const rowId = getContentRowId(ownerKey);

  const nextContent = normalizeContent({
    ...content,
    updatedAt: new Date().toISOString()
  });

  await getPool().query(
    `
      insert into studio_archive_content (id, content, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (id)
      do update set content = excluded.content, updated_at = now()
    `,
    [rowId, JSON.stringify(nextContent)]
  );

  return nextContent;
}

async function readFileBuilderPage(
  pageKind: BuilderPageKind,
  ownerKey = defaultContentOwnerKey
): Promise<BuilderPage> {
  try {
    const page = await readJsonFile<BuilderPage>(
      getEditablePagePath(pageKind, ownerKey)
    );
    return normalizeBuilderPage({
      ...page,
      id: getOwnerPageId(pageKind, ownerKey),
      slug: getOwnerBuilderPageSlug(pageKind, ownerKey)
    });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      const seedPage = await getSeedBuilderPage(pageKind);
      return normalizeBuilderPage({
        ...seedPage,
        id: getOwnerPageId(pageKind, ownerKey),
        slug: getOwnerBuilderPageSlug(pageKind, ownerKey)
      });
    }

    throw error;
  }
}

async function readFilePublishedPortfolioByPublicSlug(
  publicSlug: string
): Promise<PublishedPortfolio | undefined> {
  const pages: Array<{ filePath: string; ownerKey: string }> = [
    {
      filePath: editablePagePath,
      ownerKey: defaultContentOwnerKey
    }
  ];

  try {
    const files = await fs.readdir(dataRoot);

    for (const file of files) {
      const match = file.match(/^studio-archive-page-home-(.+)\.json$/);

      if (match?.[1]) {
        pages.push({
          filePath: path.join(dataRoot, file),
          ownerKey: normalizeContentOwnerKey(match[1])
        });
      }
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }

  for (const candidate of pages) {
    try {
      const page = normalizeBuilderPage(
        await readJsonFile<BuilderPage>(candidate.filePath)
      );

      if (page.publishedPublicSlug === publicSlug) {
        return {
          ownerKey: candidate.ownerKey,
          page: normalizeBuilderPage({
            ...page,
            seoTitle: page.publishedSeoTitle ?? page.seoTitle,
            seoDescription: page.publishedSeoDescription ?? page.seoDescription,
            sections: page.publishedSections ?? page.sections,
            status: "published"
          }),
          publicSlug
        };
      }
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return undefined;
}

async function saveFileBuilderPage(
  page: BuilderPage,
  pageKind: BuilderPageKind,
  ownerKey = defaultContentOwnerKey
): Promise<BuilderPage> {
  const nextPage = normalizeBuilderPage({
    ...page,
    id: getOwnerPageId(pageKind, ownerKey),
    slug: getOwnerBuilderPageSlug(pageKind, ownerKey),
    updatedAt: new Date().toISOString()
  });

  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(
    getEditablePagePath(pageKind, ownerKey),
    JSON.stringify(nextPage, null, 2),
    "utf8"
  );

  return nextPage;
}

async function publishFileBuilderPage(
  page: BuilderPage,
  pageKind: BuilderPageKind,
  ownerKey = defaultContentOwnerKey
): Promise<BuilderPage> {
  const now = new Date().toISOString();
  const isPortfolioHome = pageKind === "home";
  const publishName = isPortfolioHome
    ? page.publishName?.trim() || page.title || "my"
    : page.publishName ?? "";
  const publicSlug = isPortfolioHome
    ? getPublicPortfolioSlug(publishName)
    : page.publicSlug;
  const nextPage = normalizeBuilderPage({
    ...page,
    id: getOwnerPageId(pageKind, ownerKey),
    slug: getOwnerBuilderPageSlug(pageKind, ownerKey),
    publishName,
    publicSlug,
    status: "published",
    publishedSections: page.sections,
    publishedSeoTitle: page.seoTitle,
    publishedSeoDescription: page.seoDescription,
    publishedPublicSlug: isPortfolioHome ? publicSlug : undefined,
    publishedAt: now,
    updatedAt: now
  });

  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(
    getEditablePagePath(pageKind, ownerKey),
    JSON.stringify(nextPage, null, 2),
    "utf8"
  );

  return nextPage;
}

async function readDatabaseBuilderPage(slug = "home"): Promise<BuilderPage> {
  await ensurePageTable();

  const result = await getPool().query<{
    id: string;
    slug: string;
    title: string;
    seoTitle: string | null;
    seoDescription: string | null;
    publishName: string | null;
    publicSlug: string | null;
    status: BuilderPage["status"];
    sections: BuilderSection[];
    publishedSections: BuilderSection[] | null;
    publishedSeoTitle: string | null;
    publishedSeoDescription: string | null;
    publishedPublicSlug: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
  }>(
    `
      select
        id,
        slug,
        title,
        seo_title as "seoTitle",
        seo_description as "seoDescription",
        publish_name as "publishName",
        public_slug as "publicSlug",
        status,
        sections,
        published_sections as "publishedSections",
        published_seo_title as "publishedSeoTitle",
        published_seo_description as "publishedSeoDescription",
        published_public_slug as "publishedPublicSlug",
        published_at as "publishedAt",
        updated_at as "updatedAt"
      from studio_archive_pages
      where slug = $1
    `,
    [slug]
  );

  const row = result.rows[0];

  if (row) {
    return normalizeBuilderPage({
      id: row.id,
      slug: row.slug,
      title: row.title,
      seoTitle: row.seoTitle ?? row.title,
      seoDescription: row.seoDescription ?? "",
      publishName: row.publishName ?? "",
      publicSlug: row.publicSlug ?? undefined,
      status: row.status,
      sections: row.sections,
      publishedSections: row.publishedSections ?? undefined,
      publishedSeoTitle: row.publishedSeoTitle ?? undefined,
      publishedSeoDescription: row.publishedSeoDescription ?? undefined,
      publishedPublicSlug: row.publishedPublicSlug ?? undefined,
      publishedAt: row.publishedAt?.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    });
  }

  const pageKind = getBuilderPageKindFromSlug(slug);
  const ownerKey = getOwnerKeyFromPageSlug(slug);
  const seedPage = await getSeedBuilderPage(pageKind);
  return saveDatabaseBuilderPage({
    ...seedPage,
    id: getOwnerPageId(pageKind, ownerKey),
    slug
  });
}

async function readDatabasePublishedPortfolioByPublicSlug(
  publicSlug: string
): Promise<PublishedPortfolio | undefined> {
  await ensurePageTable();

  const result = await getPool().query<{
    id: string;
    slug: string;
    title: string;
    seoTitle: string | null;
    seoDescription: string | null;
    publishName: string | null;
    publicSlug: string | null;
    status: BuilderPage["status"];
    sections: BuilderSection[];
    publishedSections: BuilderSection[] | null;
    publishedSeoTitle: string | null;
    publishedSeoDescription: string | null;
    publishedPublicSlug: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
  }>(
    `
      select
        id,
        slug,
        title,
        seo_title as "seoTitle",
        seo_description as "seoDescription",
        publish_name as "publishName",
        public_slug as "publicSlug",
        status,
        sections,
        published_sections as "publishedSections",
        published_seo_title as "publishedSeoTitle",
        published_seo_description as "publishedSeoDescription",
        published_public_slug as "publishedPublicSlug",
        published_at as "publishedAt",
        updated_at as "updatedAt"
      from studio_archive_pages
      where published_public_slug = $1
      limit 1
    `,
    [publicSlug]
  );

  const row = result.rows[0];

  if (!row?.publishedPublicSlug) {
    return undefined;
  }

  const page = normalizeBuilderPage({
    id: row.id,
    slug: row.slug,
    title: row.title,
    seoTitle: row.publishedSeoTitle ?? row.seoTitle ?? row.title,
    seoDescription: row.publishedSeoDescription ?? row.seoDescription ?? "",
    publishName: row.publishName ?? "",
    publicSlug: row.publicSlug ?? undefined,
    status: "published",
    sections: row.publishedSections ?? row.sections,
    publishedSections: row.publishedSections ?? undefined,
    publishedSeoTitle: row.publishedSeoTitle ?? undefined,
    publishedSeoDescription: row.publishedSeoDescription ?? undefined,
    publishedPublicSlug: row.publishedPublicSlug,
    publishedAt: row.publishedAt?.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  });

  return {
    ownerKey: getOwnerKeyFromPageSlug(row.slug),
    page,
    publicSlug: row.publishedPublicSlug
  };
}

async function saveDatabaseBuilderPage(page: BuilderPage): Promise<BuilderPage> {
  await ensurePageTable();

  const nextPage = normalizeBuilderPage({
    ...page,
    updatedAt: new Date().toISOString()
  });

  await getPool().query(
    `
      insert into studio_archive_pages (
        id,
        slug,
        title,
        seo_title,
        seo_description,
        publish_name,
        public_slug,
        status,
        sections,
        published_sections,
        published_seo_title,
        published_seo_description,
        published_public_slug,
        published_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14::timestamptz, now())
      on conflict (slug)
      do update set
        title = excluded.title,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        publish_name = excluded.publish_name,
        public_slug = excluded.public_slug,
        status = excluded.status,
        sections = excluded.sections,
        updated_at = now()
    `,
    [
      nextPage.id,
      nextPage.slug,
      nextPage.title,
      nextPage.seoTitle,
      nextPage.seoDescription,
      nextPage.publishName ?? "",
      nextPage.publicSlug ?? null,
      nextPage.status,
      JSON.stringify(nextPage.sections),
      nextPage.publishedSections
        ? JSON.stringify(nextPage.publishedSections)
        : null,
      nextPage.publishedSeoTitle ?? null,
      nextPage.publishedSeoDescription ?? null,
      nextPage.publishedPublicSlug ?? null,
      nextPage.publishedAt ?? null
    ]
  );

  return nextPage;
}

async function assertPublicSlugAvailable(publicSlug: string, pageSlug: string) {
  await ensurePageTable();

  const result = await getPool().query<{ slug: string }>(
    `
      select slug
      from studio_archive_pages
      where published_public_slug = $1
        and slug <> $2
      limit 1
    `,
    [publicSlug, pageSlug]
  );

  if (result.rows[0]) {
    throw new Error("이미 사용 중인 게시 주소입니다. 다른 설정명을 입력해 주세요.");
  }
}

async function publishDatabaseBuilderPage(
  page: BuilderPage
): Promise<BuilderPage> {
  await ensurePageTable();

  const now = new Date().toISOString();
  const isPortfolioHome = getBuilderPageKindFromSlug(page.slug) === "home";
  const publishName = isPortfolioHome
    ? page.publishName?.trim() || page.title || "my"
    : page.publishName ?? "";
  const publicSlug = isPortfolioHome
    ? getPublicPortfolioSlug(publishName)
    : page.publicSlug;
  const nextPage = normalizeBuilderPage({
    ...page,
    publishName,
    publicSlug,
    status: "published",
    publishedSections: page.sections,
    publishedSeoTitle: page.seoTitle,
    publishedSeoDescription: page.seoDescription,
    publishedPublicSlug: isPortfolioHome ? publicSlug : undefined,
    publishedAt: now,
    updatedAt: now
  });

  if (isPortfolioHome && publicSlug) {
    await assertPublicSlugAvailable(publicSlug, nextPage.slug);
  }

  await getPool().query(
    `
      insert into studio_archive_pages (
        id,
        slug,
        title,
        seo_title,
        seo_description,
        publish_name,
        public_slug,
        status,
        sections,
        published_sections,
        published_seo_title,
        published_seo_description,
        published_public_slug,
        published_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, now(), now())
      on conflict (slug)
      do update set
        title = excluded.title,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        publish_name = excluded.publish_name,
        public_slug = excluded.public_slug,
        status = excluded.status,
        sections = excluded.sections,
        published_sections = excluded.published_sections,
        published_seo_title = excluded.published_seo_title,
        published_seo_description = excluded.published_seo_description,
        published_public_slug = excluded.published_public_slug,
        published_at = now(),
        updated_at = now()
    `,
    [
      nextPage.id,
      nextPage.slug,
      nextPage.title,
      nextPage.seoTitle,
      nextPage.seoDescription,
      nextPage.publishName ?? "",
      nextPage.publicSlug ?? null,
      nextPage.status,
      JSON.stringify(nextPage.sections),
      JSON.stringify(nextPage.publishedSections ?? nextPage.sections),
      nextPage.publishedSeoTitle ?? nextPage.seoTitle,
      nextPage.publishedSeoDescription ?? nextPage.seoDescription,
      nextPage.publishedPublicSlug ?? null
    ]
  );

  return nextPage;
}

export function getContentStorageMode(): ContentStorageMode {
  return databaseUrl ? "database" : "file";
}

export async function getStudioArchiveContent(
  ownerKey = defaultContentOwnerKey
): Promise<StudioArchiveContent> {
  noStore();

  if (getContentStorageMode() === "database") {
    return readDatabaseContent(ownerKey);
  }

  return readFileContent(ownerKey);
}

export async function saveStudioArchiveContent(
  content: StudioArchiveContent,
  ownerKey = defaultContentOwnerKey
): Promise<StudioArchiveContent> {
  if (getContentStorageMode() === "database") {
    return saveDatabaseContent(content, ownerKey);
  }

  return saveFileContent(content, ownerKey);
}

export async function getBuilderPage(
  slug = "home",
  ownerKey = defaultContentOwnerKey
): Promise<BuilderPage> {
  noStore();
  const pageKind = normalizeBuilderPageKind(slug);
  const pageSlug = getOwnerBuilderPageSlug(pageKind, ownerKey);

  if (getContentStorageMode() === "database") {
    return readDatabaseBuilderPage(pageSlug);
  }

  return readFileBuilderPage(pageKind, ownerKey);
}

export async function saveBuilderPage(
  page: BuilderPage,
  ownerKey = defaultContentOwnerKey,
  slug = "home"
): Promise<BuilderPage> {
  const pageKind = normalizeBuilderPageKind(slug);
  const nextPage = {
    ...page,
    id: getOwnerPageId(pageKind, ownerKey),
    slug: getOwnerBuilderPageSlug(pageKind, ownerKey)
  };

  if (getContentStorageMode() === "database") {
    return saveDatabaseBuilderPage(nextPage);
  }

  return saveFileBuilderPage(nextPage, pageKind, ownerKey);
}

export async function publishBuilderPage(
  page: BuilderPage,
  ownerKey = defaultContentOwnerKey,
  slug = "home"
): Promise<BuilderPage> {
  const pageKind = normalizeBuilderPageKind(slug);
  const nextPage = {
    ...page,
    id: getOwnerPageId(pageKind, ownerKey),
    slug: getOwnerBuilderPageSlug(pageKind, ownerKey)
  };

  if (getContentStorageMode() === "database") {
    return publishDatabaseBuilderPage(nextPage);
  }

  return publishFileBuilderPage(nextPage, pageKind, ownerKey);
}

export async function getPublishedBuilderPage(
  slug = "home",
  ownerKey = defaultContentOwnerKey
): Promise<BuilderPage> {
  const page = await getBuilderPage(slug, ownerKey);

  return normalizeBuilderPage({
    ...page,
    seoTitle: page.publishedSeoTitle ?? page.seoTitle,
    seoDescription: page.publishedSeoDescription ?? page.seoDescription,
    sections: page.publishedSections ?? page.sections,
    status: "published"
  });
}

export async function getPublishedPortfolioByPublicSlug(
  value: string
): Promise<PublishedPortfolio | undefined> {
  noStore();

  const normalizedValue = normalizePublicPortfolioName(value);

  if (!normalizedValue.endsWith(`-${publicPortfolioSuffix}`)) {
    return undefined;
  }

  const publicSlug = getPublicPortfolioSlug(normalizedValue);

  if (getContentStorageMode() === "database") {
    return readDatabasePublishedPortfolioByPublicSlug(publicSlug);
  }

  return readFilePublishedPortfolioByPublicSlug(publicSlug);
}

export async function getAllCategories(
  ownerKey = defaultContentOwnerKey
): Promise<string[]> {
  const content = await getStudioArchiveContent(ownerKey);
  return content.categories;
}

export async function getAllProjects(
  ownerKey = defaultContentOwnerKey
): Promise<Project[]> {
  const content = await getStudioArchiveContent(ownerKey);
  return content.projects;
}

export async function getFeaturedProjects(
  ownerKey = defaultContentOwnerKey
): Promise<Project[]> {
  const projects = await getAllProjects(ownerKey);
  const featured = projects.filter((project) => project.featured);
  return (featured.length ? featured : projects).slice(0, 6);
}

export async function getProjectBySlug(
  slug: string,
  ownerKey = defaultContentOwnerKey
): Promise<Project | undefined> {
  const projects = await getAllProjects(ownerKey);
  return projects.find((project) => project.slug === slug);
}

export async function getProjectsByCategory(
  category: string,
  ownerKey = defaultContentOwnerKey
): Promise<Project[]> {
  const projects = await getAllProjects(ownerKey);
  return projects.filter((project) => project.category === category);
}

export function getProjectNeighbors(projects: Project[], slug: string) {
  const currentIndex = projects.findIndex((project) => project.slug === slug);

  if (currentIndex === -1 || projects.length < 2) {
    return { previous: undefined, next: undefined };
  }

  const previousIndex =
    currentIndex === 0 ? projects.length - 1 : currentIndex - 1;
  const nextIndex =
    currentIndex === projects.length - 1 ? 0 : currentIndex + 1;

  return {
    previous: projects[previousIndex],
    next: projects[nextIndex]
  };
}

export async function getAllNotes(
  ownerKey = defaultContentOwnerKey
): Promise<Note[]> {
  const content = await getStudioArchiveContent(ownerKey);
  return content.notes;
}

export async function getRecentNotes(
  limit = 4,
  ownerKey = defaultContentOwnerKey
): Promise<Note[]> {
  const notes = await getAllNotes(ownerKey);
  return notes.slice(0, limit);
}
