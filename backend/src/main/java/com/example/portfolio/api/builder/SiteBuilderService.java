package com.example.portfolio.api.builder;

import com.example.portfolio.api.builder.dto.BlockRequest;
import com.example.portfolio.api.builder.dto.BlockResponse;
import com.example.portfolio.api.builder.dto.BulkBlockRequest;
import com.example.portfolio.api.builder.dto.BuilderProjectRequest;
import com.example.portfolio.api.builder.dto.BuilderProjectResponse;
import com.example.portfolio.api.builder.dto.BuilderProjectWithBlocksResponse;
import com.example.portfolio.api.builder.dto.BuilderStateResponse;
import com.example.portfolio.api.builder.dto.PageRequest;
import com.example.portfolio.api.builder.dto.PageResponse;
import com.example.portfolio.api.builder.dto.PageWithBlocksResponse;
import com.example.portfolio.api.builder.dto.ReorderItemsRequest;
import com.example.portfolio.api.builder.dto.SiteRenderResponse;
import com.example.portfolio.api.builder.dto.SiteRequest;
import com.example.portfolio.api.builder.dto.SiteResponse;
import com.example.portfolio.common.util.SlugGenerator;
import com.example.portfolio.domain.block.Block;
import com.example.portfolio.domain.block.BlockRepository;
import com.example.portfolio.domain.block.BlockType;
import com.example.portfolio.domain.builderproject.BuilderProject;
import com.example.portfolio.domain.builderproject.BuilderProjectRepository;
import com.example.portfolio.domain.builderproject.BuilderProjectVisibility;
import com.example.portfolio.domain.page.PageType;
import com.example.portfolio.domain.page.SitePage;
import com.example.portfolio.domain.page.SitePageRepository;
import com.example.portfolio.domain.site.Site;
import com.example.portfolio.domain.site.SiteRepository;
import com.example.portfolio.domain.theme.Theme;
import com.example.portfolio.domain.theme.ThemeRepository;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SiteBuilderService {

    private final SiteRepository siteRepository;
    private final SitePageRepository pageRepository;
    private final BlockRepository blockRepository;
    private final BuilderProjectRepository projectRepository;
    private final ThemeRepository themeRepository;
    private final SlugGenerator slugGenerator;

    public SiteBuilderService(
        SiteRepository siteRepository,
        SitePageRepository pageRepository,
        BlockRepository blockRepository,
        BuilderProjectRepository projectRepository,
        ThemeRepository themeRepository,
        SlugGenerator slugGenerator
    ) {
        this.siteRepository = siteRepository;
        this.pageRepository = pageRepository;
        this.blockRepository = blockRepository;
        this.projectRepository = projectRepository;
        this.themeRepository = themeRepository;
        this.slugGenerator = slugGenerator;
    }

    @Transactional
    public BuilderStateResponse getState() {
        Site site = getOrCreateDefaultSite();
        return new BuilderStateResponse(SiteResponse.from(site), listPageResponses(site.getId()), listProjectResponses(site.getId()));
    }

    @Transactional
    public SiteResponse updateSite(SiteRequest request) {
        Site site = getOrCreateDefaultSite();
        String slug = slugGenerator.from(request.slug());
        if (siteRepository.existsBySlugAndIdNot(slug, site.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Site slug already exists");
        }
        Theme theme = request.themeId() == null
            ? site.getTheme()
            : themeRepository.findById(request.themeId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Theme not found"));
        site.update(
            slug,
            request.title().trim(),
            clean(request.description()),
            clean(request.profileImageUrl()),
            request.published() == null || request.published(),
            theme
        );
        return SiteResponse.from(site);
    }

    @Transactional(readOnly = true)
    public List<PageResponse> listPages() {
        Site site = getExistingSite();
        return listPageResponses(site.getId());
    }

    @Transactional
    public PageResponse createPage(PageRequest request) {
        Site site = getOrCreateDefaultSite();
        String slug = uniquePageSlug(site.getId(), StringUtils.hasText(request.slug()) ? request.slug() : request.title());
        int sortOrder = request.sortOrder() == null ? (int) pageRepository.countBySiteId(site.getId()) : request.sortOrder();
        SitePage page = new SitePage(site, request.title().trim(), slug, request.pageType(), sortOrder);
        page.update(
            request.title().trim(),
            slug,
            request.pageType(),
            request.publicPage() == null || request.publicPage(),
            request.navVisible() == null || request.navVisible(),
            sortOrder,
            clean(request.seoTitle()),
            clean(request.seoDescription())
        );
        return PageResponse.from(pageRepository.save(page));
    }

    @Transactional
    public PageResponse updatePage(Long pageId, PageRequest request) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        String rawSlug = StringUtils.hasText(request.slug()) ? request.slug() : request.title();
        String slug = slugGenerator.from(rawSlug);
        if (pageRepository.existsBySiteIdAndSlugAndIdNot(site.getId(), slug, pageId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Page slug already exists");
        }
        page.update(
            request.title().trim(),
            slug,
            request.pageType(),
            request.publicPage() == null || request.publicPage(),
            request.navVisible() == null || request.navVisible(),
            request.sortOrder() == null ? page.getSortOrder() : request.sortOrder(),
            clean(request.seoTitle()),
            clean(request.seoDescription())
        );
        return PageResponse.from(page);
    }

    @Transactional
    public void deletePage(Long pageId) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        pageRepository.delete(page);
    }

    @Transactional
    public void reorderPages(ReorderItemsRequest request) {
        Site site = getOrCreateDefaultSite();
        int order = 0;
        for (Long pageId : request.ids()) {
            findPage(site.getId(), pageId).updateSortOrder(order++);
        }
    }

    @Transactional(readOnly = true)
    public List<BuilderProjectResponse> listProjects() {
        Site site = getExistingSite();
        return listProjectResponses(site.getId());
    }

    @Transactional
    public BuilderProjectResponse createProject(BuilderProjectRequest request) {
        Site site = getOrCreateDefaultSite();
        String slug = uniqueProjectSlug(site.getId(), StringUtils.hasText(request.slug()) ? request.slug() : request.title());
        int sortOrder = request.sortOrder() == null ? (int) projectRepository.countBySiteId(site.getId()) : request.sortOrder();
        BuilderProject project = new BuilderProject(site, request.title().trim(), slug, sortOrder);
        updateProjectFields(project, slug, request, sortOrder);
        BuilderProject savedProject = projectRepository.save(project);
        seedProjectBlocks(savedProject);
        return BuilderProjectResponse.from(savedProject);
    }

    @Transactional(readOnly = true)
    public BuilderProjectWithBlocksResponse getProject(Long projectId) {
        Site site = getExistingSite();
        BuilderProject project = findProject(site.getId(), projectId);
        return BuilderProjectWithBlocksResponse.from(project, blockRepository.findByProjectIdOrderBySortOrderAscCreatedAtAsc(project.getId()));
    }

    @Transactional
    public BuilderProjectResponse updateProject(Long projectId, BuilderProjectRequest request) {
        Site site = getOrCreateDefaultSite();
        BuilderProject project = findProject(site.getId(), projectId);
        String rawSlug = StringUtils.hasText(request.slug()) ? request.slug() : request.title();
        String slug = slugGenerator.from(rawSlug);
        if (projectRepository.existsBySiteIdAndSlugAndIdNot(site.getId(), slug, projectId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project slug already exists");
        }
        updateProjectFields(project, slug, request, request.sortOrder() == null ? project.getSortOrder() : request.sortOrder());
        return BuilderProjectResponse.from(project);
    }

    @Transactional
    public void deleteProject(Long projectId) {
        Site site = getOrCreateDefaultSite();
        BuilderProject project = findProject(site.getId(), projectId);
        projectRepository.delete(project);
    }

    @Transactional
    public void reorderProjects(ReorderItemsRequest request) {
        Site site = getOrCreateDefaultSite();
        int order = 0;
        for (Long projectId : request.ids()) {
            findProject(site.getId(), projectId).updateSortOrder(order++);
        }
    }

    @Transactional(readOnly = true)
    public PageWithBlocksResponse getPage(Long pageId) {
        Site site = getExistingSite();
        SitePage page = findPage(site.getId(), pageId);
        return PageWithBlocksResponse.from(page, blockRepository.findByPageIdOrderBySortOrderAscCreatedAtAsc(page.getId()));
    }

    @Transactional(readOnly = true)
    public List<BlockResponse> listBlocks(Long pageId) {
        Site site = getExistingSite();
        SitePage page = findPage(site.getId(), pageId);
        return blockRepository.findByPageIdOrderBySortOrderAscCreatedAtAsc(page.getId())
            .stream()
            .map(BlockResponse::from)
            .toList();
    }

    @Transactional
    public BlockResponse createBlock(Long pageId, BlockRequest request) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        int sortOrder = request.sortOrder() == null ? (int) blockRepository.countByPageId(pageId) : request.sortOrder();
        Map<String, Object> content = normalizeContent(request.blockType(), request.content());
        Block block = new Block(page, request.blockType(), content, sortOrder);
        applyBlockRequest(block, request, sortOrder);
        return BlockResponse.from(blockRepository.save(block));
    }

    @Transactional
    public BlockResponse updateBlock(Long pageId, Long blockId, BlockRequest request) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        Block block = blockRepository.findByIdAndPageId(blockId, page.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
        applyBlockRequest(block, request, request.sortOrder() == null ? block.getSortOrder() : request.sortOrder());
        return BlockResponse.from(block);
    }

    @Transactional
    public List<BlockResponse> saveBlocks(Long pageId, BulkBlockRequest request) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        int order = 0;
        for (BlockRequest blockRequest : request.blocks()) {
            int sortOrder = blockRequest.sortOrder() == null ? order : blockRequest.sortOrder();
            Block block = blockRequest.id() == null
                ? new Block(page, blockRequest.blockType(), normalizeContent(blockRequest.blockType(), blockRequest.content()), sortOrder)
                : blockRepository.findByIdAndPageId(blockRequest.id(), page.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
            applyBlockRequest(block, blockRequest, sortOrder);
            blockRepository.save(block);
            order++;
        }
        return blockRepository.findByPageIdOrderBySortOrderAscCreatedAtAsc(page.getId())
            .stream()
            .map(BlockResponse::from)
            .toList();
    }

    @Transactional
    public void deleteBlock(Long pageId, Long blockId) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        Block block = blockRepository.findByIdAndPageId(blockId, page.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
        blockRepository.delete(block);
    }

    @Transactional
    public void reorderBlocks(Long pageId, ReorderItemsRequest request) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        int order = 0;
        for (Long blockId : request.ids()) {
            blockRepository.findByIdAndPageId(blockId, page.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"))
                .updateSortOrder(order++);
        }
    }

    @Transactional(readOnly = true)
    public List<BlockResponse> listProjectBlocks(Long projectId) {
        Site site = getExistingSite();
        BuilderProject project = findProject(site.getId(), projectId);
        return blockRepository.findByProjectIdOrderBySortOrderAscCreatedAtAsc(project.getId())
            .stream()
            .map(BlockResponse::from)
            .toList();
    }

    @Transactional
    public BlockResponse createProjectBlock(Long projectId, BlockRequest request) {
        Site site = getOrCreateDefaultSite();
        BuilderProject project = findProject(site.getId(), projectId);
        int sortOrder = request.sortOrder() == null ? (int) blockRepository.countByProjectId(projectId) : request.sortOrder();
        Map<String, Object> content = normalizeContent(request.blockType(), request.content());
        Block block = new Block(project, request.blockType(), content, sortOrder);
        applyBlockRequest(block, request, sortOrder);
        return BlockResponse.from(blockRepository.save(block));
    }

    @Transactional
    public BlockResponse updateProjectBlock(Long projectId, Long blockId, BlockRequest request) {
        Site site = getOrCreateDefaultSite();
        BuilderProject project = findProject(site.getId(), projectId);
        Block block = blockRepository.findByIdAndProjectId(blockId, project.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
        applyBlockRequest(block, request, request.sortOrder() == null ? block.getSortOrder() : request.sortOrder());
        return BlockResponse.from(block);
    }

    @Transactional
    public List<BlockResponse> saveProjectBlocks(Long projectId, BulkBlockRequest request) {
        Site site = getOrCreateDefaultSite();
        BuilderProject project = findProject(site.getId(), projectId);
        int order = 0;
        for (BlockRequest blockRequest : request.blocks()) {
            int sortOrder = blockRequest.sortOrder() == null ? order : blockRequest.sortOrder();
            Block block = blockRequest.id() == null
                ? new Block(project, blockRequest.blockType(), normalizeContent(blockRequest.blockType(), blockRequest.content()), sortOrder)
                : blockRepository.findByIdAndProjectId(blockRequest.id(), project.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
            applyBlockRequest(block, blockRequest, sortOrder);
            blockRepository.save(block);
            order++;
        }
        return blockRepository.findByProjectIdOrderBySortOrderAscCreatedAtAsc(project.getId())
            .stream()
            .map(BlockResponse::from)
            .toList();
    }

    @Transactional
    public void deleteProjectBlock(Long projectId, Long blockId) {
        Site site = getOrCreateDefaultSite();
        BuilderProject project = findProject(site.getId(), projectId);
        Block block = blockRepository.findByIdAndProjectId(blockId, project.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
        blockRepository.delete(block);
    }

    @Transactional
    public void reorderProjectBlocks(Long projectId, ReorderItemsRequest request) {
        Site site = getOrCreateDefaultSite();
        BuilderProject project = findProject(site.getId(), projectId);
        int order = 0;
        for (Long blockId : request.ids()) {
            blockRepository.findByIdAndProjectId(blockId, project.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"))
                .updateSortOrder(order++);
        }
    }

    @Transactional
    public SiteRenderResponse getPublicSite(String slug) {
        Site site = StringUtils.hasText(slug)
            ? siteRepository.findBySlugAndPublishedTrue(slug).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"))
            : getOrCreateDefaultSite();
        if (!site.isPublished()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found");
        }
        List<PageWithBlocksResponse> pages = pageRepository.findBySiteIdAndPublicPageTrueOrderBySortOrderAscCreatedAtAsc(site.getId())
            .stream()
            .map(page -> PageWithBlocksResponse.from(page, blockRepository.findByPageIdOrderBySortOrderAscCreatedAtAsc(page.getId())))
            .toList();
        List<BuilderProjectResponse> projects = projectRepository.findBySiteIdAndVisibilityOrderBySortOrderAscCreatedAtAsc(
                site.getId(),
                BuilderProjectVisibility.PUBLIC
            )
            .stream()
            .map(BuilderProjectResponse::from)
            .toList();
        return new SiteRenderResponse(SiteResponse.from(site), pages, projects);
    }

    @Transactional
    public BuilderProjectWithBlocksResponse getPublicProject(String siteSlug, String projectSlug) {
        Site site = StringUtils.hasText(siteSlug)
            ? siteRepository.findBySlugAndPublishedTrue(siteSlug).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"))
            : getOrCreateDefaultSite();
        BuilderProject project = projectRepository.findBySiteIdAndSlugAndVisibility(site.getId(), projectSlug, BuilderProjectVisibility.PUBLIC)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        return BuilderProjectWithBlocksResponse.from(project, blockRepository.findByProjectIdOrderBySortOrderAscCreatedAtAsc(project.getId()));
    }

    private List<PageResponse> listPageResponses(Long siteId) {
        return pageRepository.findBySiteIdOrderBySortOrderAscCreatedAtAsc(siteId)
            .stream()
            .map(PageResponse::from)
            .toList();
    }

    private List<BuilderProjectResponse> listProjectResponses(Long siteId) {
        return projectRepository.findBySiteIdOrderBySortOrderAscCreatedAtAsc(siteId)
            .stream()
            .map(BuilderProjectResponse::from)
            .toList();
    }

    private void updateProjectFields(BuilderProject project, String slug, BuilderProjectRequest request, int sortOrder) {
        project.update(
            request.title().trim(),
            slug,
            clean(request.subtitle()),
            clean(request.summary()),
            clean(request.description()),
            clean(request.period()),
            clean(request.role()),
            clean(request.contribution()),
            clean(request.category()),
            clean(request.thumbnailUrl()),
            cleanTechStacks(request.techStacks()),
            clean(request.githubUrl()),
            clean(request.liveUrl()),
            request.visibility(),
            sortOrder,
            clean(request.seoTitle()),
            clean(request.seoDescription())
        );
    }

    private Site getExistingSite() {
        return siteRepository.findFirstByOrderByIdAsc()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
    }

    private Site getOrCreateDefaultSite() {
        Site site = siteRepository.findFirstByOrderByIdAsc().orElseGet(this::createDefaultSite);
        ensureDefaultProject(site);
        return site;
    }

    private void ensureDefaultProject(Site site) {
        if (projectRepository.countBySiteId(site.getId()) == 0) {
            BuilderProject project = new BuilderProject(site, "포트폴리오 빌더", "portfolio-builder", 0);
            project.update(
                "포트폴리오 빌더",
                "portfolio-builder",
                "블록 기반 포트폴리오 제작 플랫폼",
                "프로젝트 상세 페이지 안의 모든 텍스트와 섹션을 직접 편집할 수 있는 MVP입니다.",
                "React, Spring Boot, PostgreSQL 기반으로 만든 포트폴리오 웹 게시 플랫폼입니다.",
                "2026.06 - 2026.07",
                "Full-stack Developer",
                "100%",
                "Web Platform",
                "",
                new String[] {"React", "Spring Boot", "PostgreSQL"},
                "https://github.com/jeongmin7386/Portfolio-Web",
                "",
                BuilderProjectVisibility.PUBLIC,
                0,
                "포트폴리오 빌더",
                "블록 기반 포트폴리오 제작 플랫폼"
            );
            seedProjectBlocks(projectRepository.save(project));
        }
    }

    private Site createDefaultSite() {
        Theme theme = themeRepository.findFirstByOrderByIdAsc()
            .orElseGet(() -> themeRepository.save(new Theme("Studio Minimal", defaultThemeSettings())));
        Site site = siteRepository.save(new Site("my-portfolio", "나의 포트폴리오"));
        site.update(
            "my-portfolio",
            "나의 포트폴리오",
            "프로젝트와 작업 과정을 보여주는 개인 포트폴리오입니다.",
            null,
            true,
            theme
        );

        SitePage home = pageRepository.save(new SitePage(site, "홈", "home", PageType.HOME, 0));
        blockRepository.save(new Block(home, BlockType.HEADING, mapOf("text", "작업을 시각적으로 보여주는 포트폴리오", "level", 1), 0));
        blockRepository.save(new Block(home, BlockType.TEXT, mapOf("text", "페이지와 블록을 추가해 나만의 포트폴리오 사이트를 구성하세요."), 1));
        blockRepository.save(new Block(home, BlockType.PROJECT_CARD, mapOf(
            "title", "대표 프로젝트",
            "description", "문제 정의부터 결과까지 보여주는 케이스 스터디 카드입니다.",
            "imageUrl", "",
            "href", "#"
        ), 2));

        SitePage about = pageRepository.save(new SitePage(site, "소개", "about", PageType.ABOUT, 1));
        blockRepository.save(new Block(about, BlockType.QUOTE, mapOf("text", "좋은 포트폴리오는 결과뿐 아니라 사고 과정까지 보여줍니다.", "cite", "Canvasfolio"), 0));
        blockRepository.save(new Block(about, BlockType.CALLOUT, mapOf("tone", "warm", "text", "소개, 역량, 협업 방식 등을 이 페이지에 정리해보세요."), 1));

        SitePage contact = pageRepository.save(new SitePage(site, "연락", "contact", PageType.CONTACT, 2));
        blockRepository.save(new Block(contact, BlockType.BUTTON, mapOf("label", "이메일 보내기", "href", "mailto:hello@example.com"), 0));

        BuilderProject project = new BuilderProject(site, "포트폴리오 빌더", "portfolio-builder", 0);
        project.update(
            "포트폴리오 빌더",
            "portfolio-builder",
            "블록 기반 포트폴리오 제작 플랫폼",
            "프로젝트 상세 페이지 안의 모든 텍스트와 섹션을 직접 편집할 수 있는 MVP입니다.",
            "React, Spring Boot, PostgreSQL 기반으로 만든 포트폴리오 웹 게시 플랫폼입니다.",
            "2026.06 - 2026.07",
            "Full-stack Developer",
            "100%",
            "Web Platform",
            "",
            new String[] {"React", "Spring Boot", "PostgreSQL"},
            "https://github.com/jeongmin7386/Portfolio-Web",
            "",
            BuilderProjectVisibility.PUBLIC,
            0,
            "포트폴리오 빌더",
            "블록 기반 포트폴리오 제작 플랫폼"
        );
        seedProjectBlocks(projectRepository.save(project));
        return site;
    }

    private SitePage findPage(Long siteId, Long pageId) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found"));
    }

    private BuilderProject findProject(Long siteId, Long projectId) {
        return projectRepository.findByIdAndSiteId(projectId, siteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private String uniquePageSlug(Long siteId, String value) {
        String base = slugGenerator.from(value);
        String candidate = base;
        int suffix = 2;
        while (pageRepository.existsBySiteIdAndSlug(siteId, candidate)) {
            candidate = base + "-" + suffix;
            suffix++;
        }
        return candidate;
    }

    private String uniqueProjectSlug(Long siteId, String value) {
        String base = slugGenerator.from(value);
        String candidate = base;
        int suffix = 2;
        while (projectRepository.existsBySiteIdAndSlug(siteId, candidate)) {
            candidate = base + "-" + suffix;
            suffix++;
        }
        return candidate;
    }

    private void seedProjectBlocks(BuilderProject project) {
        blockRepository.save(new Block(project, BlockType.HEADING, mapOf("text", project.getTitle(), "level", 1), 0));
        blockRepository.save(new Block(project, BlockType.TEXT, mapOf("text", project.getSummary()), 1));
        blockRepository.save(new Block(project, BlockType.PROJECT_INFO, mapOf(
            "period", project.getPeriod(),
            "role", project.getRole(),
            "contribution", project.getContribution(),
            "category", project.getCategory(),
            "techStacks", Arrays.asList(project.getTechStacks())
        ), 2));
        blockRepository.save(new Block(project, BlockType.CALLOUT, mapOf(
            "title", "문제 정의",
            "text", "포트폴리오 상세 페이지의 모든 텍스트와 섹션을 사용자가 직접 수정할 수 있어야 했습니다."
        ), 3));
        blockRepository.save(new Block(project, BlockType.QUOTE, mapOf(
            "text", "좋은 프로젝트 페이지는 결과뿐 아니라 판단 과정과 배운 점까지 보여줍니다.",
            "cite", "프로젝트 회고"
        ), 4));
    }

    private Map<String, Object> normalizeContent(BlockType blockType, Map<String, Object> content) {
        if (content != null && !content.isEmpty()) {
            return new LinkedHashMap<>(content);
        }
        return defaultContent(blockType);
    }

    private Map<String, Object> normalizeSettings(Map<String, Object> settings) {
        if (settings != null && !settings.isEmpty()) {
            return new LinkedHashMap<>(settings);
        }
        return mapOf("width", "normal", "align", "left", "paddingTop", 0, "paddingBottom", 0);
    }

    private Map<String, Object> normalizeStyles(Map<String, Object> styles, Map<String, Object> settings) {
        if (styles != null && !styles.isEmpty()) {
            return new LinkedHashMap<>(styles);
        }
        if (settings != null && !settings.isEmpty()) {
            return new LinkedHashMap<>(settings);
        }
        return mapOf(
            "fontSize", 18,
            "fontWeight", 500,
            "color", "#111111",
            "backgroundColor", "transparent",
            "borderRadius", 8,
            "padding", 0,
            "margin", 0,
            "opacity", 1,
            "textAlign", "left",
            "borderWidth", 0,
            "borderColor", "#111111"
        );
    }

    private Map<String, Object> normalizeLayout(Map<String, Object> layout, int sortOrder) {
        if (layout != null && !layout.isEmpty()) {
            return new LinkedHashMap<>(layout);
        }
        int y = 40 + (sortOrder * 220);
        return mapOf(
            "desktop", mapOf("x", 80, "y", y, "width", 720, "height", 180, "zIndex", sortOrder + 1),
            "tablet", mapOf("x", 40, "y", y, "width", 560, "height", 180, "zIndex", sortOrder + 1),
            "mobile", mapOf("x", 20, "y", y, "width", 320, "height", 180, "zIndex", sortOrder + 1)
        );
    }

    private void applyBlockRequest(Block block, BlockRequest request, int sortOrder) {
        block.update(
            request.blockType(),
            normalizeContent(request.blockType(), request.content()),
            normalizeSettings(request.settings()),
            normalizeStyles(request.styles(), request.settings()),
            normalizeLayout(request.layout(), sortOrder),
            clean(request.sectionId()),
            sortOrder,
            request.visible() == null || request.visible()
        );
    }

    private Map<String, Object> defaultContent(BlockType blockType) {
        return switch (blockType) {
            case HEADING -> mapOf("text", "새 제목", "level", 2);
            case IMAGE -> mapOf("imageUrl", "", "alt", "포트폴리오 이미지", "caption", "");
            case PHOTO_GRID -> mapOf(
                "images",
                List.of(mapOf("url", "", "alt", "이미지 설명", "caption", "캡션")),
                "columns",
                3,
                "gap",
                16
            );
            case DIVIDER -> mapOf("style", "line");
            case QUOTE -> mapOf("text", "인용문을 입력하세요.", "cite", "");
            case CALLOUT -> mapOf("icon", "idea", "title", "핵심 포인트", "text", "강조하고 싶은 내용을 입력하세요.");
            case BUTTON -> mapOf("label", "버튼", "url", "#", "target", "_blank");
            case PROJECT_CARD -> mapOf("title", "새 프로젝트", "description", "프로젝트 설명을 입력하세요.", "imageUrl", "", "href", "#");
            case PROJECT_INFO -> mapOf("period", "2026.06 - 2026.07", "role", "역할", "contribution", "100%", "category", "Portfolio", "techStacks", List.of("React"));
            case TABS -> mapOf(
                "tabs",
                List.of(
                    mapOf("title", "기획", "content", "기획 과정 설명"),
                    mapOf("title", "디자인", "content", "디자인 과정 설명"),
                    mapOf("title", "개발", "content", "개발 과정 설명")
                )
            );
            case TWO_COLUMN -> mapOf("leftTitle", "문제", "leftText", "문제 설명", "rightTitle", "해결", "rightText", "해결 과정 설명");
            default -> mapOf("text", "새 블록 내용을 입력하세요.");
        };
    }

    private Map<String, Object> defaultThemeSettings() {
        return mapOf(
            "accentColor", "#111111",
            "fontFamily", "Pretendard",
            "background", "#f7f4ee",
            "radius", 8,
            "spacing", 32
        );
    }

    private Map<String, Object> mapOf(Object... values) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            map.put(String.valueOf(values[index]), values[index + 1]);
        }
        return map;
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

    private String clean(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
