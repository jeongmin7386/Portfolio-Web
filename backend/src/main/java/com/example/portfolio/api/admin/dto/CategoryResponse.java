package com.example.portfolio.api.admin.dto;

import com.example.portfolio.domain.category.Category;

public record CategoryResponse(
    Long id,
    String name,
    String slug,
    int sortOrder
) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug(), category.getSortOrder());
    }
}
