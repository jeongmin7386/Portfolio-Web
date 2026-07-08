import fs from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { Pool, type PoolConfig } from "pg";

import {
  PROJECT_CATEGORIES,
  type Note,
  type Project,
  type StudioArchiveContent
} from "@/lib/types";

export type ContentStorageMode = "database" | "file";

const contentRoot = path.join(process.cwd(), "content");
const projectsRoot = path.join(contentRoot, "projects");
const notesRoot = path.join(contentRoot, "notes");
const contentRowId = "studio-archive";

const dataRoot = process.env.STUDIO_ARCHIVE_DATA_DIR
  ? path.resolve(process.env.STUDIO_ARCHIVE_DATA_DIR)
  : path.join(process.cwd(), "data");
const editableContentPath = path.join(dataRoot, "studio-archive-content.json");
const databaseUrl =
  process.env.STUDIO_ARCHIVE_DATABASE_URL ?? process.env.DATABASE_URL;

let pool: Pool | undefined;
let tableReady = false;

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
  if (tableReady) {
    return;
  }

  await getPool().query(`
    create table if not exists studio_archive_content (
      id text primary key,
      content jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  tableReady = true;
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

async function readFileContent(): Promise<StudioArchiveContent> {
  try {
    const content =
      await readJsonFile<StudioArchiveContent>(editableContentPath);
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
  content: StudioArchiveContent
): Promise<StudioArchiveContent> {
  const nextContent = normalizeContent({
    ...content,
    updatedAt: new Date().toISOString()
  });

  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(
    editableContentPath,
    JSON.stringify(nextContent, null, 2),
    "utf8"
  );

  return nextContent;
}

async function readDatabaseContent(): Promise<StudioArchiveContent> {
  await ensureContentTable();

  const result = await getPool().query<{ content: StudioArchiveContent }>(
    "select content from studio_archive_content where id = $1",
    [contentRowId]
  );

  const content = result.rows[0]?.content;

  if (content) {
    return normalizeContent(content);
  }

  const seedContent = await readFileContent();
  return saveDatabaseContent(seedContent);
}

async function saveDatabaseContent(
  content: StudioArchiveContent
): Promise<StudioArchiveContent> {
  await ensureContentTable();

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
    [contentRowId, JSON.stringify(nextContent)]
  );

  return nextContent;
}

export function getContentStorageMode(): ContentStorageMode {
  return databaseUrl ? "database" : "file";
}

export async function getStudioArchiveContent(): Promise<StudioArchiveContent> {
  noStore();

  if (getContentStorageMode() === "database") {
    return readDatabaseContent();
  }

  return readFileContent();
}

export async function saveStudioArchiveContent(
  content: StudioArchiveContent
): Promise<StudioArchiveContent> {
  if (getContentStorageMode() === "database") {
    return saveDatabaseContent(content);
  }

  return saveFileContent(content);
}

export async function getAllCategories(): Promise<string[]> {
  const content = await getStudioArchiveContent();
  return content.categories;
}

export async function getAllProjects(): Promise<Project[]> {
  const content = await getStudioArchiveContent();
  return content.projects;
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  const featured = projects.filter((project) => project.featured);
  return (featured.length ? featured : projects).slice(0, 6);
}

export async function getProjectBySlug(
  slug: string
): Promise<Project | undefined> {
  const projects = await getAllProjects();
  return projects.find((project) => project.slug === slug);
}

export async function getProjectsByCategory(
  category: string
): Promise<Project[]> {
  const projects = await getAllProjects();
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

export async function getAllNotes(): Promise<Note[]> {
  const content = await getStudioArchiveContent();
  return content.notes;
}

export async function getRecentNotes(limit = 4): Promise<Note[]> {
  const notes = await getAllNotes();
  return notes.slice(0, limit);
}
