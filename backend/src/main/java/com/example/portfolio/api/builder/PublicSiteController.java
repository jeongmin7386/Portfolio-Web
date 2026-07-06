package com.example.portfolio.api.builder;

import com.example.portfolio.api.builder.dto.BuilderProjectWithBlocksResponse;
import com.example.portfolio.api.builder.dto.SiteRenderResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/site")
public class PublicSiteController {

    private final SiteBuilderService builderService;

    public PublicSiteController(SiteBuilderService builderService) {
        this.builderService = builderService;
    }

    @GetMapping
    SiteRenderResponse getDefaultSite() {
        return builderService.getPublicSite(null);
    }

    @GetMapping("/{slug}")
    SiteRenderResponse getSite(@PathVariable String slug) {
        return builderService.getPublicSite(slug);
    }

    @GetMapping("/projects/{projectSlug}")
    BuilderProjectWithBlocksResponse getDefaultProject(@PathVariable String projectSlug) {
        return builderService.getPublicProject(null, projectSlug);
    }

    @GetMapping("/{slug}/projects/{projectSlug}")
    BuilderProjectWithBlocksResponse getProject(@PathVariable String slug, @PathVariable String projectSlug) {
        return builderService.getPublicProject(slug, projectSlug);
    }
}
