package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.builderproject.BuilderProjectVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BuilderProjectRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 200) String slug,
    String subtitle,
    String summary,
    String description,
    String period,
    String role,
    String contribution,
    String category,
    String thumbnailUrl,
    List<String> techStacks,
    String githubUrl,
    String liveUrl,
    BuilderProjectVisibility visibility,
    Integer sortOrder,
    String seoTitle,
    String seoDescription
) {
}
