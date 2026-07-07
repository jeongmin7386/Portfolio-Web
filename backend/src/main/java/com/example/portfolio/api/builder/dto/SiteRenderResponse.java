package com.example.portfolio.api.builder.dto;

import java.util.List;

public record SiteRenderResponse(
    SiteResponse site,
    List<PageWithBlocksResponse> pages,
    List<BuilderProjectResponse> projects
) {
}
