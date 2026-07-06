package com.example.portfolio.api.publicportfolio;

import com.example.portfolio.api.publicportfolio.dto.PublicCategoryResponse;
import com.example.portfolio.api.publicportfolio.dto.PublicPortfolioResponse;
import com.example.portfolio.api.publicportfolio.dto.PublicProfileResponse;
import com.example.portfolio.api.publicportfolio.dto.PublicProjectResponse;
import com.example.portfolio.domain.category.CategoryRepository;
import com.example.portfolio.domain.profile.PortfolioProfile;
import com.example.portfolio.domain.profile.PortfolioProfileRepository;
import com.example.portfolio.domain.project.ProjectRepository;
import com.example.portfolio.domain.project.ProjectVisibility;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicPortfolioService {

    private final PortfolioProfileRepository profileRepository;
    private final CategoryRepository categoryRepository;
    private final ProjectRepository projectRepository;

    public PublicPortfolioService(
        PortfolioProfileRepository profileRepository,
        CategoryRepository categoryRepository,
        ProjectRepository projectRepository
    ) {
        this.profileRepository = profileRepository;
        this.categoryRepository = categoryRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public PublicPortfolioResponse getPortfolio(String slug, String categorySlug) {
        PortfolioProfile profile = findPublicProfile(slug);
        Long userId = profile.getUser().getId();

        List<PublicCategoryResponse> categories = categoryRepository.findByUserIdOrderBySortOrderAscNameAsc(userId)
            .stream()
            .map(PublicCategoryResponse::from)
            .toList();
        List<PublicProjectResponse> projects = listProjects(userId, categorySlug);

        return new PublicPortfolioResponse(PublicProfileResponse.from(profile), categories, projects);
    }

    @Transactional(readOnly = true)
    public List<PublicProjectResponse> getProjects(String slug, String categorySlug) {
        PortfolioProfile profile = findPublicProfile(slug);
        return listProjects(profile.getUser().getId(), categorySlug);
    }

    @Transactional(readOnly = true)
    public PublicProjectResponse getProject(String slug, String projectSlug) {
        PortfolioProfile profile = findPublicProfile(slug);
        return projectRepository.findByUserIdAndSlugAndVisibility(profile.getUser().getId(), projectSlug, ProjectVisibility.PUBLIC)
            .map(PublicProjectResponse::from)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private PortfolioProfile findPublicProfile(String slug) {
        PortfolioProfile profile = profileRepository.findBySlug(slug)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));
        if (!profile.isPublicProfile()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found");
        }
        return profile;
    }

    private List<PublicProjectResponse> listProjects(Long userId, String categorySlug) {
        if (StringUtils.hasText(categorySlug)) {
            return projectRepository.findByUserIdAndVisibilityAndCategorySlugOrderBySortOrderAscCreatedAtDesc(
                    userId,
                    ProjectVisibility.PUBLIC,
                    categorySlug
                )
                .stream()
                .map(PublicProjectResponse::from)
                .toList();
        }
        return projectRepository.findByUserIdAndVisibilityOrderBySortOrderAscCreatedAtDesc(userId, ProjectVisibility.PUBLIC)
            .stream()
            .map(PublicProjectResponse::from)
            .toList();
    }
}
