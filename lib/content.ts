import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

import type { Note, Project, ProjectCategory } from "@/lib/types";

const contentRoot = path.join(process.cwd(), "content");
const projectsRoot = path.join(contentRoot, "projects");
const notesRoot = path.join(contentRoot, "notes");

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

export const getAllProjects = cache(async (): Promise<Project[]> => {
  const projects = await readJsonDirectory<Project>(projectsRoot);

  return projects.sort((a, b) => {
    const yearDelta = Number(b.year) - Number(a.year);
    return yearDelta || a.title.localeCompare(b.title);
  });
});

export const getFeaturedProjects = cache(async (): Promise<Project[]> => {
  const projects = await getAllProjects();
  const featured = projects.filter((project) => project.featured);
  return (featured.length ? featured : projects).slice(0, 6);
});

export const getProjectBySlug = cache(
  async (slug: string): Promise<Project | undefined> => {
    const projects = await getAllProjects();
    return projects.find((project) => project.slug === slug);
  }
);

export const getProjectsByCategory = cache(
  async (category: ProjectCategory): Promise<Project[]> => {
    const projects = await getAllProjects();
    return projects.filter((project) => project.category === category);
  }
);

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

export const getAllNotes = cache(async (): Promise<Note[]> => {
  const notes = await readJsonDirectory<Note>(notesRoot);
  return notes.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});

export const getRecentNotes = cache(async (limit = 4): Promise<Note[]> => {
  const notes = await getAllNotes();
  return notes.slice(0, limit);
});
