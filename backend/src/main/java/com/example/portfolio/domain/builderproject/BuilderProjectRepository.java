package com.example.portfolio.domain.builderproject;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BuilderProjectRepository extends JpaRepository<BuilderProject, Long> {

    List<BuilderProject> findBySiteIdOrderBySortOrderAscCreatedAtAsc(Long siteId);

    List<BuilderProject> findBySiteIdAndVisibilityOrderBySortOrderAscCreatedAtAsc(Long siteId, BuilderProjectVisibility visibility);

    Optional<BuilderProject> findByIdAndSiteId(Long id, Long siteId);

    Optional<BuilderProject> findBySiteIdAndSlugAndVisibility(Long siteId, String slug, BuilderProjectVisibility visibility);

    boolean existsBySiteIdAndSlug(Long siteId, String slug);

    boolean existsBySiteIdAndSlugAndIdNot(Long siteId, String slug, Long id);

    long countBySiteId(Long siteId);
}
