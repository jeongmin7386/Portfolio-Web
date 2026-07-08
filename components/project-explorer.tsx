"use client";

import { useMemo, useState } from "react";

import {
  CategoryFilter,
  type CategorySelection
} from "@/components/category-filter";
import { ProjectGrid } from "@/components/project-grid";
import type { Project } from "@/lib/types";

type ProjectExplorerProps = {
  categories: string[];
  projects: Project[];
};

export function ProjectExplorer({
  categories,
  projects
}: ProjectExplorerProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategorySelection>("전체");

  const visibleCategories = useMemo(() => {
    const projectCategories = projects.map((project) => project.category);
    return Array.from(new Set([...categories, ...projectCategories]));
  }, [categories, projects]);

  const counts = useMemo(() => {
    const nextCounts: Partial<Record<CategorySelection, number>> = {
      전체: projects.length
    };

    visibleCategories.forEach((category) => {
      nextCounts[category] = projects.filter(
        (project) => project.category === category
      ).length;
    });

    return nextCounts;
  }, [projects, visibleCategories]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "전체") {
      return projects;
    }

    return projects.filter((project) => project.category === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <>
      <CategoryFilter
        categories={visibleCategories}
        counts={counts}
        onChange={setSelectedCategory}
        selected={selectedCategory}
      />
      <ProjectGrid projects={filteredProjects} />
    </>
  );
}
