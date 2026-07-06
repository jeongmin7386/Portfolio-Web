package com.example.portfolio.api.admin.dto;

import com.example.portfolio.domain.category.Category;
import com.example.portfolio.domain.project.Project;
import com.example.portfolio.domain.project.ProjectVisibility;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record ProjectResponse(
    Long id,
    String title,
    String slug,
    String description,
    String thumbnailUrl,
    List<String> techStacks,
    String githubUrl,
    String liveUrl,
    ProjectVisibility visibility,
    int sortOrder,
    CategorySummary category,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {

    public static ProjectResponse from(Project project) {
        Category category = project.getCategory();
        return new ProjectResponse(
            project.getId(),
            project.getTitle(),
            project.getSlug(),
            project.getDescription(),
            project.getThumbnailUrl(),
            Arrays.stream(project.getTechStacks()).toList(),
            project.getGithubUrl(),
            project.getLiveUrl(),
            project.getVisibility(),
            project.getSortOrder(),
            category == null ? null : CategorySummary.from(category),
            project.getCreatedAt(),
            project.getUpdatedAt()
        );
    }

    public record CategorySummary(
        Long id,
        String name,
        String slug
    ) {

        static CategorySummary from(Category category) {
            return new CategorySummary(category.getId(), category.getName(), category.getSlug());
        }
    }
}
