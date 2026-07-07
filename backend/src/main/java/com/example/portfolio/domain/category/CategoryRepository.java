package com.example.portfolio.domain.category;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserIdOrderBySortOrderAscNameAsc(Long userId);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    Optional<Category> findBySlugAndUserId(String slug, Long userId);

    boolean existsByUserIdAndSlug(Long userId, String slug);

    boolean existsByUserIdAndSlugAndIdNot(Long userId, String slug, Long id);
}
