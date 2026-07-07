package com.example.portfolio.api.publicportfolio.dto;

import com.example.portfolio.domain.category.Category;

public record PublicCategoryResponse(
    Long id,
    String name,
    String slug
) {

    public static PublicCategoryResponse from(Category category) {
        return new PublicCategoryResponse(category.getId(), category.getName(), category.getSlug());
    }
}
