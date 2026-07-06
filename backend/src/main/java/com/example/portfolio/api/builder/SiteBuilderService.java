package com.example.portfolio.api.builder;

import com.example.portfolio.api.builder.dto.BlockRequest;
import com.example.portfolio.api.builder.dto.BlockResponse;
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
import com.example.portfolio.domain.page.PageType;
import com.example.portfolio.domain.page.SitePage;
import com.example.portfolio.domain.page.SitePageRepository;
import com.example.portfolio.domain.site.Site;
import com.example.portfolio.domain.site.SiteRepository;
import com.example.portfolio.domain.theme.Theme;
import com.example.portfolio.domain.theme.ThemeRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    private final ThemeRepository themeRepository;
    private final SlugGenerator slugGenerator;

    public SiteBuilderService(
        SiteRepository siteRepository,
        SitePageRepository pageRepository,
        BlockRepository blockRepository,
        ThemeRepository themeRepository,
        SlugGenerator slugGenerator
    ) {
        this.siteRepository = siteRepository;
        this.pageRepository = pageRepository;
        this.blockRepository = blockRepository;
        this.themeRepository = themeRepository;
        this.slugGenerator = slugGenerator;
    }

    @Transactional
    public BuilderStateResponse getState() {
        Site site = getOrCreateDefaultSite();
        return new BuilderStateResponse(SiteResponse.from(site), listPageResponses(site.getId()));
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
        return BlockResponse.from(blockRepository.save(block));
    }

    @Transactional
    public BlockResponse updateBlock(Long pageId, Long blockId, BlockRequest request) {
        Site site = getOrCreateDefaultSite();
        SitePage page = findPage(site.getId(), pageId);
        Block block = blockRepository.findByIdAndPageId(blockId, page.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
        block.update(
            request.blockType(),
            normalizeContent(request.blockType(), request.content()),
            request.sortOrder() == null ? block.getSortOrder() : request.sortOrder()
        );
        return BlockResponse.from(block);
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
        return new SiteRenderResponse(SiteResponse.from(site), pages);
    }

    private List<PageResponse> listPageResponses(Long siteId) {
        return pageRepository.findBySiteIdOrderBySortOrderAscCreatedAtAsc(siteId)
            .stream()
            .map(PageResponse::from)
            .toList();
    }

    private Site getExistingSite() {
        return siteRepository.findFirstByOrderByIdAsc()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
    }

    private Site getOrCreateDefaultSite() {
        return siteRepository.findFirstByOrderByIdAsc().orElseGet(this::createDefaultSite);
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
        return site;
    }

    private SitePage findPage(Long siteId, Long pageId) {
        return pageRepository.findByIdAndSiteId(pageId, siteId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found"));
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

    private Map<String, Object> normalizeContent(BlockType blockType, Map<String, Object> content) {
        if (content != null && !content.isEmpty()) {
            return new LinkedHashMap<>(content);
        }
        return defaultContent(blockType);
    }

    private Map<String, Object> defaultContent(BlockType blockType) {
        return switch (blockType) {
            case HEADING -> mapOf("text", "새 제목", "level", 2);
            case IMAGE -> mapOf("imageUrl", "", "alt", "포트폴리오 이미지", "caption", "");
            case DIVIDER -> mapOf("style", "line");
            case QUOTE -> mapOf("text", "인용문을 입력하세요.", "cite", "");
            case CALLOUT -> mapOf("tone", "neutral", "text", "강조하고 싶은 내용을 입력하세요.");
            case BUTTON -> mapOf("label", "버튼", "href", "#");
            case PROJECT_CARD -> mapOf("title", "새 프로젝트", "description", "프로젝트 설명을 입력하세요.", "imageUrl", "", "href", "#");
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

    private String clean(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
