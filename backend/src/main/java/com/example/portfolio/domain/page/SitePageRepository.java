package com.example.portfolio.domain.page;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SitePageRepository extends JpaRepository<SitePage, Long> {

    List<SitePage> findBySiteIdOrderBySortOrderAscCreatedAtAsc(Long siteId);

    List<SitePage> findBySiteIdAndPublicPageTrueOrderBySortOrderAscCreatedAtAsc(Long siteId);

    Optional<SitePage> findByIdAndSiteId(Long id, Long siteId);

    Optional<SitePage> findBySiteIdAndSlugAndPublicPageTrue(Long siteId, String slug);

    boolean existsBySiteIdAndSlug(Long siteId, String slug);

    boolean existsBySiteIdAndSlugAndIdNot(Long siteId, String slug, Long id);

    long countBySiteId(Long siteId);
}
