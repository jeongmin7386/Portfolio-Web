package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.site.Site;

public record SiteResponse(
    Long id,
    String slug,
    String title,
    String description,
    String profileImageUrl,
    boolean published,
    ThemeResponse theme
) {
    public static SiteResponse from(Site site) {
        ThemeResponse theme = site.getTheme() == null ? null : ThemeResponse.from(site.getTheme());
        return new SiteResponse(
            site.getId(),
            site.getSlug(),
            site.getTitle(),
            site.getDescription(),
            site.getProfileImageUrl(),
            site.isPublished(),
            theme
        );
    }
}
