import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolConfig } from "pg";

import {
  getBuilderPage,
  getStudioArchiveContent,
  normalizeContentOwnerKey,
  saveBuilderPage,
  saveStudioArchiveContent
} from "@/lib/content";
import {
  assertSupportedStudioProjectImport,
  ContentValidationError,
  validateBuilderPage,
  validateStudioArchiveContent
} from "@/lib/content-validation";
import type { BuilderPage, StudioArchiveContent } from "@/lib/types";

export const STUDIO_PROJECT_SCHEMA_VERSION = 1;

export type StudioProjectStatus = "draft" | "published";

export type StudioProjectAsset = {
  id: string;
  url: string;
  kind: "image" | "embed" | "link";
};

export type StudioProjectData = {
  schemaVersion: number;
  project: {
    id?: string;
    name: string;
    thumbnail?: string;
    status: StudioProjectStatus;
    revision: number;
    updatedAt: string;
    publishedAt?: string;
  };
  content: StudioArchiveContent;
  pages: {
    home: BuilderPage;
    archive: BuilderPage;
  };
  assets: StudioProjectAsset[];
  theme: Record<string, unknown>;
  seo: Record<string, unknown>;
  publish: {
    homePublicSlug?: string;
    archivePath: string;
  };
};

export type StudioProjectRecord = {
  id: string;
  ownerKey: string;
  name: string;
  thumbnail?: string;
  status: StudioProjectStatus;
  revision: number;
  schemaVersion: number;
  data: StudioProjectData;
  publishedData?: StudioProjectData;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type StudioProjectSummary = Omit<
  StudioProjectRecord,
  "data" | "publishedData"
>;

export type StudioProjectExportFile = {
  schemaVersion: number;
  exportedAt: string;
  source: "studio-fallen-flower";
  project: {
    id: string;
    name: string;
    thumbnail?: string;
    status: StudioProjectStatus;
    revision: number;
    updatedAt: string;
    publishedAt?: string;
  };
  data: StudioProjectData;
  publishedData?: StudioProjectData;
};

export class StudioProjectError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "StudioProjectError";
    this.status = status;
  }
}

export class StudioProjectConflictError extends StudioProjectError {
  latestRevision: number;
  latestUpdatedAt: string;

  constructor(latestRevision: number, latestUpdatedAt: string) {
    super("다른 탭이나 기기에서 더 최신 버전이 저장되었습니다.", 409);
    this.name = "StudioProjectConflictError";
    this.latestRevision = latestRevision;
    this.latestUpdatedAt = latestUpdatedAt;
  }
}

type StudioProjectRow = {
  id: string;
  ownerKey: string;
  name: string;
  thumbnail: string | null;
  status: StudioProjectStatus;
  revision: number;
  schemaVersion: number;
  data: StudioProjectData;
  publishedData: StudioProjectData | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt: Date | string | null;
};

const databaseUrl =
  process.env.STUDIO_ARCHIVE_DATABASE_URL ?? process.env.DATABASE_URL;
const dataRoot = process.env.STUDIO_ARCHIVE_DATA_DIR
  ? path.resolve(process.env.STUDIO_ARCHIVE_DATA_DIR)
  : path.join(process.cwd(), "data");
const projectStoreRoot = path.join(dataRoot, "studio-projects");

let pool: Pool | undefined;
let projectTableReady = false;

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

async function ensureStudioProjectsTable() {
  if (projectTableReady) {
    return;
  }

  await getPool().query(`
    create table if not exists studio_projects (
      id text primary key,
      owner_key text not null,
      name text not null,
      thumbnail text,
      status text not null default 'draft',
      revision integer not null default 1,
      schema_version integer not null default 1,
      data jsonb not null,
      published_data jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      published_at timestamptz
    )
  `);

  await getPool().query(`
    create index if not exists studio_projects_owner_updated_idx
      on studio_projects (owner_key, updated_at desc)
  `);

  projectTableReady = true;
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeOwnerKey(ownerKey: string) {
  return normalizeContentOwnerKey(ownerKey);
}

function normalizeRecord(record: StudioProjectRecord): StudioProjectRecord {
  const now = new Date().toISOString();
  const revision = Number.isFinite(record.revision) ? record.revision : 1;
  const status: StudioProjectStatus =
    record.status === "published" ? "published" : "draft";

  return {
    ...record,
    ownerKey: normalizeOwnerKey(record.ownerKey),
    name: record.name.trim() || "무제 프로젝트",
    status,
    revision,
    schemaVersion: record.schemaVersion || STUDIO_PROJECT_SCHEMA_VERSION,
    data: normalizeProjectData(record.data, {
      id: record.id,
      name: record.name,
      status,
      revision,
      updatedAt: record.updatedAt || now,
      publishedAt: record.publishedAt
    }),
    publishedData: record.publishedData
      ? normalizeProjectData(record.publishedData, {
          id: record.id,
          name: record.name,
          status: "published",
          revision,
          updatedAt: record.updatedAt || now,
          publishedAt: record.publishedAt
        })
      : undefined,
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || now,
    publishedAt: record.publishedAt
  };
}

function rowToRecord(row: StudioProjectRow): StudioProjectRecord {
  return normalizeRecord({
    id: row.id,
    ownerKey: row.ownerKey,
    name: row.name,
    thumbnail: row.thumbnail ?? undefined,
    status: row.status === "published" ? "published" : "draft",
    revision: row.revision,
    schemaVersion: row.schemaVersion,
    data: row.data,
    publishedData: row.publishedData ?? undefined,
    createdAt: toIsoDate(row.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoDate(row.updatedAt) ?? new Date().toISOString(),
    publishedAt: toIsoDate(row.publishedAt)
  });
}

function getOwnerStorePath(ownerKey: string) {
  return path.join(projectStoreRoot, `${normalizeOwnerKey(ownerKey)}.json`);
}

async function readFileProjects(ownerKey: string) {
  try {
    const raw = await fs.readFile(getOwnerStorePath(ownerKey), "utf8");
    const parsed = JSON.parse(raw) as { projects?: StudioProjectRecord[] };

    return (parsed.projects ?? []).map(normalizeRecord);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

async function writeFileProjects(
  ownerKey: string,
  projects: StudioProjectRecord[]
) {
  await fs.mkdir(projectStoreRoot, { recursive: true });
  await fs.writeFile(
    getOwnerStorePath(ownerKey),
    JSON.stringify({ projects }, null, 2),
    "utf8"
  );
}

function looksLikeAssetUrl(value: string) {
  return (
    value.startsWith("/uploads/") ||
    value.startsWith("/images/") ||
    /^https?:\/\/.+\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(value)
  );
}

function getAssetKind(value: string): StudioProjectAsset["kind"] {
  if (/youtube|vimeo|figma|notion|codepen/i.test(value)) {
    return "embed";
  }

  return looksLikeAssetUrl(value) ? "image" : "link";
}

function collectAssetUrls(value: unknown, urls = new Set<string>()) {
  if (typeof value === "string") {
    if (looksLikeAssetUrl(value)) {
      urls.add(value);
    }

    return urls;
  }

  if (!value || typeof value !== "object") {
    return urls;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectAssetUrls(item, urls));
    return urls;
  }

  Object.entries(value).forEach(([key, item]) => {
    if (key === "assets") {
      return;
    }

    collectAssetUrls(item, urls);
  });

  return urls;
}

function makeAsset(url: string): StudioProjectAsset {
  return {
    id: crypto.createHash("sha1").update(url).digest("hex").slice(0, 16),
    url,
    kind: getAssetKind(url)
  };
}

function pickThumbnail(data: StudioProjectData) {
  const featuredCover = data.content.projects.find(
    (project) => project.coverImage
  )?.coverImage;

  if (featuredCover) {
    return featuredCover;
  }

  return data.assets.find((asset) => asset.kind === "image")?.url;
}

function isContent(value: unknown): value is StudioArchiveContent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const content = value as Partial<StudioArchiveContent>;

  return (
    Array.isArray(content.categories) &&
    Array.isArray(content.projects) &&
    Array.isArray(content.notes)
  );
}

function isBuilderPage(value: unknown): value is BuilderPage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const page = value as Partial<BuilderPage>;

  return (
    typeof page.id === "string" &&
    typeof page.slug === "string" &&
    typeof page.title === "string" &&
    Array.isArray(page.sections)
  );
}

function isStudioProjectData(value: unknown): value is StudioProjectData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<StudioProjectData>;

  return (
    typeof data.schemaVersion === "number" &&
    data.schemaVersion <= STUDIO_PROJECT_SCHEMA_VERSION &&
    isContent(data.content) &&
    Boolean(data.pages) &&
    isBuilderPage(data.pages?.home) &&
    isBuilderPage(data.pages?.archive)
  );
}

function normalizeProjectData(
  data: StudioProjectData,
  meta: StudioProjectData["project"]
): StudioProjectData {
  const nextData = cloneJson(data);
  const assetUrls = collectAssetUrls(nextData);
  const assets = Array.from(assetUrls).map(makeAsset);

  return {
    ...nextData,
    schemaVersion: STUDIO_PROJECT_SCHEMA_VERSION,
    project: {
      ...meta,
      name: meta.name.trim() || "무제 프로젝트",
      thumbnail: meta.thumbnail,
      status: meta.status,
      revision: meta.revision,
      updatedAt: meta.updatedAt,
      publishedAt: meta.publishedAt
    },
    assets,
    theme: nextData.theme ?? {},
    seo: nextData.seo ?? {},
    publish: {
      homePublicSlug:
        nextData.pages.home.publishedPublicSlug ?? nextData.pages.home.publicSlug,
      archivePath: "/archive"
    }
  };
}

async function readProjects(ownerKey: string) {
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  if (databaseUrl) {
    await ensureStudioProjectsTable();
    const result = await getPool().query<{
      id: string;
      owner_key: string;
      name: string;
      thumbnail: string | null;
      status: StudioProjectStatus;
      revision: number;
      schema_version: number;
      data: StudioProjectData;
      published_data: StudioProjectData | null;
      created_at: Date;
      updated_at: Date;
      published_at: Date | null;
    }>(
      `
        select
          id,
          owner_key,
          name,
          thumbnail,
          status,
          revision,
          schema_version,
          data,
          published_data,
          created_at,
          updated_at,
          published_at
        from studio_projects
        where owner_key = $1
        order by updated_at desc
      `,
      [normalizedOwnerKey]
    );

    return result.rows.map((row) =>
      rowToRecord({
        id: row.id,
        ownerKey: row.owner_key,
        name: row.name,
        thumbnail: row.thumbnail,
        status: row.status,
        revision: row.revision,
        schemaVersion: row.schema_version,
        data: row.data,
        publishedData: row.published_data,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.published_at
      })
    );
  }

  return readFileProjects(normalizedOwnerKey);
}

async function writeProject(record: StudioProjectRecord) {
  const normalizedRecord = normalizeRecord(record);

  if (databaseUrl) {
    await ensureStudioProjectsTable();
    await getPool().query(
      `
        insert into studio_projects (
          id,
          owner_key,
          name,
          thumbnail,
          status,
          revision,
          schema_version,
          data,
          published_data,
          created_at,
          updated_at,
          published_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12)
        on conflict (id)
        do update set
          name = excluded.name,
          thumbnail = excluded.thumbnail,
          status = excluded.status,
          revision = excluded.revision,
          schema_version = excluded.schema_version,
          data = excluded.data,
          published_data = excluded.published_data,
          updated_at = excluded.updated_at,
          published_at = excluded.published_at
        where studio_projects.owner_key = excluded.owner_key
      `,
      [
        normalizedRecord.id,
        normalizedRecord.ownerKey,
        normalizedRecord.name,
        normalizedRecord.thumbnail ?? null,
        normalizedRecord.status,
        normalizedRecord.revision,
        normalizedRecord.schemaVersion,
        JSON.stringify(normalizedRecord.data),
        normalizedRecord.publishedData
          ? JSON.stringify(normalizedRecord.publishedData)
          : null,
        normalizedRecord.createdAt,
        normalizedRecord.updatedAt,
        normalizedRecord.publishedAt ?? null
      ]
    );

    return normalizedRecord;
  }

  const projects = await readFileProjects(normalizedRecord.ownerKey);
  const nextProjects = [
    normalizedRecord,
    ...projects.filter((project) => project.id !== normalizedRecord.id)
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  await writeFileProjects(normalizedRecord.ownerKey, nextProjects);

  return normalizedRecord;
}

async function removeProject(ownerKey: string, projectId: string) {
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);

  if (databaseUrl) {
    await ensureStudioProjectsTable();
    await getPool().query(
      "delete from studio_projects where owner_key = $1 and id = $2",
      [normalizedOwnerKey, projectId]
    );
    return;
  }

  const projects = await readFileProjects(normalizedOwnerKey);
  await writeFileProjects(
    normalizedOwnerKey,
    projects.filter((project) => project.id !== projectId)
  );
}

async function getProjectRecord(ownerKey: string, projectId: string) {
  const projects = await readProjects(ownerKey);
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    throw new StudioProjectError("프로젝트를 찾을 수 없습니다.", 404);
  }

  return project;
}

function toSummary(record: StudioProjectRecord): StudioProjectSummary {
  return {
    id: record.id,
    ownerKey: record.ownerKey,
    name: record.name,
    thumbnail: record.thumbnail,
    status: record.status,
    revision: record.revision,
    schemaVersion: record.schemaVersion,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt
  };
}

function assertRevision(record: StudioProjectRecord, expectedRevision?: number) {
  if (
    typeof expectedRevision === "number" &&
    expectedRevision !== record.revision
  ) {
    throw new StudioProjectConflictError(record.revision, record.updatedAt);
  }
}

export async function buildCurrentStudioProjectData(
  ownerKey: string,
  meta?: Partial<StudioProjectData["project"]>
): Promise<StudioProjectData> {
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);
  const [content, homePage, archivePage] = await Promise.all([
    getStudioArchiveContent(normalizedOwnerKey),
    getBuilderPage("home", normalizedOwnerKey),
    getBuilderPage("archive", normalizedOwnerKey)
  ]);
  const now = new Date().toISOString();
  const baseData: StudioProjectData = {
    schemaVersion: STUDIO_PROJECT_SCHEMA_VERSION,
    project: {
      name: meta?.name?.trim() || "현재 작업",
      status: meta?.status ?? "draft",
      revision: meta?.revision ?? 1,
      updatedAt: meta?.updatedAt ?? now,
      publishedAt: meta?.publishedAt
    },
    content: cloneJson(content),
    pages: {
      home: cloneJson(homePage),
      archive: cloneJson(archivePage)
    },
    assets: [],
    theme: {},
    seo: {
      homeTitle: homePage.seoTitle,
      homeDescription: homePage.seoDescription,
      archiveTitle: archivePage.seoTitle,
      archiveDescription: archivePage.seoDescription
    },
    publish: {
      homePublicSlug: homePage.publishedPublicSlug ?? homePage.publicSlug,
      archivePath: "/archive"
    }
  };
  const assets = Array.from(collectAssetUrls(baseData)).map(makeAsset);

  return {
    ...baseData,
    assets,
    project: {
      ...baseData.project,
      thumbnail: meta?.thumbnail ?? pickThumbnail({ ...baseData, assets })
    }
  };
}

export async function listStudioProjects(ownerKey: string) {
  return (await readProjects(ownerKey)).map(toSummary);
}

export async function ensureCurrentStudioProject(ownerKey: string) {
  const projects = await readProjects(ownerKey);

  if (projects.length > 0) {
    return projects[0];
  }

  return createStudioProjectFromCurrent(ownerKey, "현재 작업");
}

export async function createStudioProjectFromCurrent(
  ownerKey: string,
  name = "현재 작업"
) {
  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const data = await buildCurrentStudioProjectData(normalizedOwnerKey, {
    id,
    name,
    status: "draft",
    revision: 1,
    updatedAt: now
  });
  const record: StudioProjectRecord = {
    id,
    ownerKey: normalizedOwnerKey,
    name,
    thumbnail: pickThumbnail(data),
    status: "draft",
    revision: 1,
    schemaVersion: STUDIO_PROJECT_SCHEMA_VERSION,
    data,
    createdAt: now,
    updatedAt: now
  };

  return writeProject(record);
}

export async function saveCurrentToStudioProject(
  ownerKey: string,
  projectId: string,
  expectedRevision?: number
) {
  const existing = await getProjectRecord(ownerKey, projectId);
  assertRevision(existing, expectedRevision);

  const now = new Date().toISOString();
  const nextRevision = existing.revision + 1;
  const data = await buildCurrentStudioProjectData(ownerKey, {
    id: existing.id,
    name: existing.name,
    status: existing.status,
    revision: nextRevision,
    updatedAt: now,
    publishedAt: existing.publishedAt
  });
  const nextRecord: StudioProjectRecord = {
    ...existing,
    data,
    revision: nextRevision,
    thumbnail: pickThumbnail(data),
    updatedAt: now
  };

  return writeProject(nextRecord);
}

export async function publishCurrentStudioProject(
  ownerKey: string,
  projectId: string,
  expectedRevision?: number
) {
  const existing = await getProjectRecord(ownerKey, projectId);
  assertRevision(existing, expectedRevision);

  const now = new Date().toISOString();
  const nextRevision = existing.revision + 1;
  const data = await buildCurrentStudioProjectData(ownerKey, {
    id: existing.id,
    name: existing.name,
    status: "published",
    revision: nextRevision,
    updatedAt: now,
    publishedAt: now
  });
  const nextRecord: StudioProjectRecord = {
    ...existing,
    data,
    publishedData: data,
    status: "published",
    revision: nextRevision,
    thumbnail: pickThumbnail(data),
    updatedAt: now,
    publishedAt: now
  };

  return writeProject(nextRecord);
}

export async function openStudioProject(ownerKey: string, projectId: string) {
  const project = await getProjectRecord(ownerKey, projectId);

  await Promise.all([
    saveStudioArchiveContent(project.data.content, ownerKey),
    saveBuilderPage(project.data.pages.home, ownerKey, "home"),
    saveBuilderPage(project.data.pages.archive, ownerKey, "archive")
  ]);

  return project;
}

export async function renameStudioProject(
  ownerKey: string,
  projectId: string,
  name: string
) {
  const existing = await getProjectRecord(ownerKey, projectId);
  const now = new Date().toISOString();
  const nextName = name.trim();

  if (!nextName) {
    throw new StudioProjectError("프로젝트 이름을 입력해 주세요.");
  }

  const nextRecord: StudioProjectRecord = {
    ...existing,
    name: nextName,
    updatedAt: now,
    data: normalizeProjectData(existing.data, {
      ...existing.data.project,
      name: nextName,
      updatedAt: now
    }),
    publishedData: existing.publishedData
      ? normalizeProjectData(existing.publishedData, {
          ...existing.publishedData.project,
          name: nextName,
          updatedAt: now
        })
      : undefined
  };

  return writeProject(nextRecord);
}

export async function duplicateStudioProject(ownerKey: string, projectId: string) {
  const existing = await getProjectRecord(ownerKey, projectId);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const name = `${existing.name} 사본`;
  const data = normalizeProjectData(existing.data, {
    id,
    name,
    status: "draft",
    revision: 1,
    updatedAt: now
  });
  const nextRecord: StudioProjectRecord = {
    id,
    ownerKey: normalizeOwnerKey(ownerKey),
    name,
    thumbnail: pickThumbnail(data),
    status: "draft",
    revision: 1,
    schemaVersion: STUDIO_PROJECT_SCHEMA_VERSION,
    data,
    createdAt: now,
    updatedAt: now
  };

  return writeProject(nextRecord);
}

export async function deleteStudioProject(ownerKey: string, projectId: string) {
  await getProjectRecord(ownerKey, projectId);
  await removeProject(ownerKey, projectId);
}

export async function exportStudioProject(
  ownerKey: string,
  projectId: string
): Promise<StudioProjectExportFile> {
  const project = await getProjectRecord(ownerKey, projectId);

  return {
    schemaVersion: STUDIO_PROJECT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    source: "studio-fallen-flower",
    project: {
      id: project.id,
      name: project.name,
      thumbnail: project.thumbnail,
      status: project.status,
      revision: project.revision,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt
    },
    data: project.data,
    publishedData: project.publishedData
  };
}

export async function importStudioProject(
  ownerKey: string,
  value: unknown,
  fallbackName = "가져온 프로젝트"
) {
  assertSupportedStudioProjectImport(value);
  const exportFile = value as Partial<StudioProjectExportFile>;
  const rawData =
    exportFile?.source === "studio-fallen-flower" ? exportFile.data : value;

  if (!isStudioProjectData(rawData)) {
    throw new StudioProjectError(
      "가져올 수 없는 파일입니다. Studio Fallen Flower 내보내기 파일을 선택해 주세요."
    );
  }

  if (rawData.schemaVersion > STUDIO_PROJECT_SCHEMA_VERSION) {
    throw new StudioProjectError(
      "현재 버전보다 새로운 프로젝트 파일입니다. 사이트를 업데이트한 뒤 다시 가져와 주세요."
    );
  }

  let validatedData: StudioProjectData;

  try {
    validatedData = {
      ...rawData,
      content: validateStudioArchiveContent(rawData.content),
      pages: {
        home: validateBuilderPage(rawData.pages.home),
        archive: validateBuilderPage(rawData.pages.archive)
      }
    };
  } catch (error) {
    if (error instanceof ContentValidationError) {
      throw new StudioProjectError(error.message, 400);
    }

    throw error;
  }

  const normalizedOwnerKey = normalizeOwnerKey(ownerKey);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const importedName =
    exportFile.project?.name?.trim() || rawData.project?.name || fallbackName;
  const data = normalizeProjectData(validatedData, {
    id,
    name: importedName,
    status: "draft",
    revision: 1,
    updatedAt: now
  });
  const record: StudioProjectRecord = {
    id,
    ownerKey: normalizedOwnerKey,
    name: importedName,
    thumbnail: pickThumbnail(data),
    status: "draft",
    revision: 1,
    schemaVersion: STUDIO_PROJECT_SCHEMA_VERSION,
    data,
    createdAt: now,
    updatedAt: now
  };

  return writeProject(record);
}
