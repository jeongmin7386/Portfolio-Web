package com.example.portfolio.api.builder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SiteRequest(
    @NotBlank @Size(max = 100) String slug,
    @NotBlank @Size(max = 120) String title,
    String description,
    String profileImageUrl,
    Boolean published,
    Long themeId
) {
}
