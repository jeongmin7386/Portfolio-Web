package com.example.portfolio.api.admin.dto;

import com.example.portfolio.domain.project.ProjectVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ProjectRequest(
    @NotBlank @Size(max = 200) String title,
    String description,
    String caseStudy,
    Long categoryId,
    List<@Size(max = 40) String> techStacks,
    @Size(max = 500) String githubUrl,
    @Size(max = 500) String liveUrl,
    ProjectVisibility visibility,
    Integer sortOrder
) {
}
