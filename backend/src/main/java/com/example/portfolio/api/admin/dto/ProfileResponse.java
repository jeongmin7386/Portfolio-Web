package com.example.portfolio.api.admin.dto;

import com.example.portfolio.domain.profile.PortfolioProfile;

public record ProfileResponse(
    Long id,
    String slug,
    String displayName,
    String bio,
    String profileImageUrl,
    String theme,
    boolean publicProfile
) {

    public static ProfileResponse from(PortfolioProfile profile) {
        return new ProfileResponse(
            profile.getId(),
            profile.getSlug(),
            profile.getDisplayName(),
            profile.getBio(),
            profile.getProfileImageUrl(),
            profile.getTheme(),
            profile.isPublicProfile()
        );
    }
}
