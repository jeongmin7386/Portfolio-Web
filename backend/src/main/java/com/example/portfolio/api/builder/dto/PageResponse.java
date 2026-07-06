package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.page.PageType;
import com.example.portfolio.domain.page.SitePage;

public record PageResponse(
    Long id,
    Long siteId,
    String title,
    String slug,
    PageType pageType,
    boolean publicPage,
    boolean navVisible,
    int sortOrder,
    String seoTitle,
    String seoDescription
) {
    public static PageResponse from(SitePage page) {
        return new PageResponse(
            page.getId(),
            page.getSite().getId(),
            page.getTitle(),
            page.getSlug(),
            page.getPageType(),
            page.isPublicPage(),
            page.isNavVisible(),
            page.getSortOrder(),
            page.getSeoTitle(),
            page.getSeoDescription()
        );
    }
}
