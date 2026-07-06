package com.example.portfolio.api.publicportfolio.dto;

import com.example.portfolio.domain.profile.PortfolioProfile;

public record PublicProfileResponse(
    String slug,
    String displayName,
    String bio,
    String profileImageUrl,
    String theme
) {

    public static PublicProfileResponse from(PortfolioProfile profile) {
        return new PublicProfileResponse(
            profile.getSlug(),
            profile.getDisplayName(),
            profile.getBio(),
            profile.getProfileImageUrl(),
            profile.getTheme()
        );
    }
}
