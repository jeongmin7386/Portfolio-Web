import fs from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";

import {
  PROJECT_CATEGORIES,
  type Note,
  type Project,
  type StudioArchiveContent
} from "@/lib/types";

const contentRoot = path.join(process.cwd(), "content");
const projectsRoot = path.join(contentRoot, "projects");
const notesRoot = path.join(contentRoot, "notes");

const dataRoot = process.env.STUDIO_ARCHIVE_DATA_DIR
  ? path.resolve(process.env.STUDIO_ARCHIVE_DATA_DIR)
  : path.join(process.cwd(), "data");
const editableContentPath = path.join(dataRoot, "studio-archive-content.json");

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

async function getSeedContent(): Promise<StudioArchiveContent> {
  const [projects, notes] = await Promise.all([
    readJsonDirectory<Project>(projectsRoot),
    readJsonDirectory<Note>(notesRoot)
  ]);

  const projectCategories = projects.map((project) => project.category);
  const categories = Array.from(
    new Set([...PROJECT_CATEGORIES, ...projectCategories])
  );

  return {
    categories,
    projects: sortProjects(projects),
    notes: sortNotes(notes),
    updatedAt: new Date().toISOString()
  };
}

export async function getStudioArchiveContent(): Promise<StudioArchiveContent> {
  noStore();

  try {
    const content =
      await readJsonFile<StudioArchiveContent>(editableContentPath);

    return {
      ...content,
      categories: content.categories?.length
        ? content.categories
        : [...PROJECT_CATEGORIES],
      projects: sortProjects(content.projects ?? []),
      notes: sortNotes(content.notes ?? [])
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return getSeedContent();
    }

    throw error;
  }
}

export async function saveStudioArchiveContent(
  content: StudioArchiveContent
): Promise<StudioArchiveContent> {
  const nextContent: StudioArchiveContent = {
    categories: Array.from(new Set(content.categories.filter(Boolean))),
    projects: sortProjects(content.projects),
    notes: sortNotes(content.notes),
    updatedAt: new Date().toISOString()
  };

  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(
    editableContentPath,
    JSON.stringify(nextContent, null, 2),
    "utf8"
  );

  return nextContent;
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
