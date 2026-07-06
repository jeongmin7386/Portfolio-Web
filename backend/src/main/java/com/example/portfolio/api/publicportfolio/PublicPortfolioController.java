package com.example.portfolio.api.publicportfolio;

import com.example.portfolio.api.publicportfolio.dto.PublicPortfolioResponse;
import com.example.portfolio.api.publicportfolio.dto.PublicProjectResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/portfolios/{slug}")
public class PublicPortfolioController {

    private final PublicPortfolioService portfolioService;

    public PublicPortfolioController(PublicPortfolioService portfolioService) {
        this.portfolioService = portfolioService;
    }

    @GetMapping
    PublicPortfolioResponse getPortfolio(@PathVariable String slug, @RequestParam(required = false) String category) {
        return portfolioService.getPortfolio(slug, category);
    }

    @GetMapping("/projects")
    List<PublicProjectResponse> getProjects(@PathVariable String slug, @RequestParam(required = false) String category) {
        return portfolioService.getProjects(slug, category);
    }

    @GetMapping("/projects/{projectSlug}")
    PublicProjectResponse getProject(@PathVariable String slug, @PathVariable String projectSlug) {
        return portfolioService.getProject(slug, projectSlug);
    }
}
