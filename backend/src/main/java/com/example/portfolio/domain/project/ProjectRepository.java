package com.example.portfolio.domain.project;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByUserIdOrderBySortOrderAscCreatedAtDesc(Long userId);

    List<Project> findByUserIdAndVisibilityOrderBySortOrderAscCreatedAtDesc(Long userId, ProjectVisibility visibility);

    List<Project> findByUserIdAndVisibilityAndCategorySlugOrderBySortOrderAscCreatedAtDesc(
        Long userId,
        ProjectVisibility visibility,
        String categorySlug
    );

    Optional<Project> findByIdAndUserId(Long id, Long userId);

    Optional<Project> findByUserIdAndSlugAndVisibility(Long userId, String slug, ProjectVisibility visibility);

    boolean existsByUserIdAndSlug(Long userId, String slug);

    boolean existsByUserIdAndSlugAndIdNot(Long userId, String slug, Long id);
}
