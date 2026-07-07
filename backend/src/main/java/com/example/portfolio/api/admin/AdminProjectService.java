package com.example.portfolio.api.admin;

import com.example.portfolio.api.admin.dto.ProjectRequest;
import com.example.portfolio.api.admin.dto.ProjectResponse;
import com.example.portfolio.api.admin.dto.ReorderProjectsRequest;
import com.example.portfolio.common.util.SlugGenerator;
import com.example.portfolio.domain.category.Category;
import com.example.portfolio.domain.category.CategoryRepository;
import com.example.portfolio.domain.project.Project;
import com.example.portfolio.domain.project.ProjectRepository;
import com.example.portfolio.domain.project.ProjectVisibility;
import com.example.portfolio.domain.user.User;
import com.example.portfolio.domain.user.UserRepository;
import com.example.portfolio.storage.StorageService;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminProjectService {

    private final ProjectRepository projectRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final SlugGenerator slugGenerator;

    public AdminProjectService(
        ProjectRepository projectRepository,
        CategoryRepository categoryRepository,
        UserRepository userRepository,
        StorageService storageService,
        SlugGenerator slugGenerator
    ) {
        this.projectRepository = projectRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.slugGenerator = slugGenerator;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(Long userId) {
        return projectRepository.findByUserIdOrderBySortOrderAscCreatedAtDesc(userId)
            .stream()
            .map(ProjectResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(Long userId, Long projectId) {
        return ProjectResponse.from(findByIdAndUserId(projectId, userId));
    }

    @Transactional
    public ProjectResponse create(Long userId, ProjectRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Category category = resolveCategory(userId, request.categoryId());
        String slug = slugGenerator.unique(request.title(), candidate -> projectRepository.existsByUserIdAndSlug(userId, candidate));
        Project project = new Project(user, category, request.title().trim(), slug);
        project.update(
            category,
            request.title().trim(),
            slug,
            request.description(),
            request.caseStudy(),
            cleanTechStacks(request.techStacks()),
            request.githubUrl(),
            request.liveUrl(),
            request.visibility(),
            request.sortOrder() == null ? 0 : request.sortOrder()
        );
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(Long userId, Long projectId, ProjectRequest request) {
        Project project = findByIdAndUserId(projectId, userId);
        Category category = resolveCategory(userId, request.categoryId());
        String slug = slugGenerator.from(request.title());
        if (projectRepository.existsByUserIdAndSlugAndIdNot(userId, slug, projectId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project slug already exists");
        }

        project.update(
            category,
            request.title().trim(),
            slug,
            request.description(),
            request.caseStudy(),
            cleanTechStacks(request.techStacks()),
            request.githubUrl(),
            request.liveUrl(),
            request.visibility(),
            request.sortOrder() == null ? project.getSortOrder() : request.sortOrder()
        );
        return ProjectResponse.from(project);
    }

    @Transactional
    public ProjectResponse uploadThumbnail(Long userId, Long projectId, MultipartFile file) {
        Project project = findByIdAndUserId(projectId, userId);
        String url = storageService.storeThumbnail(userId, projectId, file);
        project.updateThumbnail(url);
        return ProjectResponse.from(project);
    }

    @Transactional
    public void reorder(Long userId, ReorderProjectsRequest request) {
        int order = 0;
        for (Long projectId : request.projectIds()) {
            Project project = findByIdAndUserId(projectId, userId);
            project.updateSortOrder(order++);
        }
    }

    @Transactional
    public void delete(Long userId, Long projectId) {
        Project project = findByIdAndUserId(projectId, userId);
        projectRepository.delete(project);
    }

    private Project findByIdAndUserId(Long projectId, Long userId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private Category resolveCategory(Long userId, Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private String[] cleanTechStacks(List<String> techStacks) {
        if (techStacks == null) {
            return new String[0];
        }
        return techStacks.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(StringUtils::hasText)
            .distinct()
            .toArray(String[]::new);
    }
}
