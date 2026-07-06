package com.example.portfolio.api.builder.dto;

import java.util.List;

public record BuilderStateResponse(
    SiteResponse site,
    List<PageResponse> pages,
    List<BuilderProjectResponse> projects
) {
}
