package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.page.PageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PageRequest(
    @NotBlank @Size(max = 160) String title,
    @Size(max = 160) String slug,
    PageType pageType,
    Boolean publicPage,
    Boolean navVisible,
    Integer sortOrder,
    String seoTitle,
    String seoDescription
) {
}
