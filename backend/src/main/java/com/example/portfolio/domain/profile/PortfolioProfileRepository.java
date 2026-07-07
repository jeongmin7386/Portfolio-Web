package com.example.portfolio.domain.profile;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioProfileRepository extends JpaRepository<PortfolioProfile, Long> {

    Optional<PortfolioProfile> findByUserId(Long userId);

    Optional<PortfolioProfile> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndUserIdNot(String slug, Long userId);
}
