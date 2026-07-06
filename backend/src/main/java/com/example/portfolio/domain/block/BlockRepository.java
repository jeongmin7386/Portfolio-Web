package com.example.portfolio.domain.block;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockRepository extends JpaRepository<Block, Long> {

    List<Block> findByPageIdOrderBySortOrderAscCreatedAtAsc(Long pageId);

    List<Block> findByPageIdInOrderByPageIdAscSortOrderAscCreatedAtAsc(List<Long> pageIds);

    Optional<Block> findByIdAndPageId(Long id, Long pageId);

    long countByPageId(Long pageId);
}
