package com.example.portfolio.api.publicportfolio.dto;

import com.example.portfolio.domain.category.Category;
import com.example.portfolio.domain.project.Project;
import java.util.Arrays;
import java.util.List;

public record PublicProjectResponse(
    Long id,
    String title,
    String slug,
    String description,
    String caseStudy,
    String thumbnailUrl,
    List<String> techStacks,
    String githubUrl,
    String liveUrl,
    PublicCategoryResponse category
) {

    public static PublicProjectResponse from(Project project) {
        Category category = project.getCategory();
        return new PublicProjectResponse(
            project.getId(),
            project.getTitle(),
            project.getSlug(),
            project.getDescription(),
            project.getCaseStudy(),
            project.getThumbnailUrl(),
            Arrays.stream(project.getTechStacks()).toList(),
            project.getGithubUrl(),
            project.getLiveUrl(),
            category == null ? null : PublicCategoryResponse.from(category)
        );
    }
}
