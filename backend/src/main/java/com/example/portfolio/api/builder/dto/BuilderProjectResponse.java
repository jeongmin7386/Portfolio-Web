package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.builderproject.BuilderProject;
import com.example.portfolio.domain.builderproject.BuilderProjectVisibility;
import java.util.Arrays;
import java.util.List;

public record BuilderProjectResponse(
    Long id,
    Long siteId,
    String title,
    String slug,
    String subtitle,
    String summary,
    String description,
    String period,
    String role,
    String contribution,
    String thumbnailUrl,
    List<String> techStacks,
    String githubUrl,
    String liveUrl,
    BuilderProjectVisibility visibility,
    int sortOrder,
    String seoTitle,
    String seoDescription
) {
    public static BuilderProjectResponse from(BuilderProject project) {
        return new BuilderProjectResponse(
            project.getId(),
            project.getSite().getId(),
            project.getTitle(),
            project.getSlug(),
            project.getSubtitle(),
            project.getSummary(),
            project.getDescription(),
            project.getPeriod(),
            project.getRole(),
            project.getContribution(),
            project.getThumbnailUrl(),
            Arrays.asList(project.getTechStacks()),
            project.getGithubUrl(),
            project.getLiveUrl(),
            project.getVisibility(),
            project.getSortOrder(),
            project.getSeoTitle(),
            project.getSeoDescription()
        );
    }
}
