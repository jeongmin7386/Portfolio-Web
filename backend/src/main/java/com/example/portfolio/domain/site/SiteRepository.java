package com.example.portfolio.domain.site;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteRepository extends JpaRepository<Site, Long> {

    Optional<Site> findFirstByOrderByIdAsc();

    Optional<Site> findBySlugAndPublishedTrue(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
