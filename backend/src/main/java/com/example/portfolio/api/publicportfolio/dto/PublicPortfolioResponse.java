package com.example.portfolio.api.publicportfolio.dto;

import java.util.List;

public record PublicPortfolioResponse(
    PublicProfileResponse profile,
    List<PublicCategoryResponse> categories,
    List<PublicProjectResponse> projects
) {
}
