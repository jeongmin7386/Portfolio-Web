"use client";

import { useMemo, useState } from "react";

import {
  CategoryFilter,
  type CategorySelection
} from "@/components/category-filter";
import { ProjectGrid } from "@/components/project-grid";
import { PROJECT_CATEGORIES, type Project } from "@/lib/types";

type ProjectExplorerProps = {
  projects: Project[];
};

export function ProjectExplorer({ projects }: ProjectExplorerProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategorySelection>("All");

  const counts = useMemo(() => {
    const nextCounts: Partial<Record<CategorySelection, number>> = {
      All: projects.length
    };

    PROJECT_CATEGORIES.forEach((category) => {
      nextCounts[category] = projects.filter(
        (project) => project.category === category
      ).length;
    });

    return nextCounts;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") {
      return projects;
    }

    return projects.filter((project) => project.category === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <>
      <CategoryFilter
        counts={counts}
        onChange={setSelectedCategory}
        selected={selectedCategory}
      />
      <ProjectGrid projects={filteredProjects} />
    </>
  );
}
