package com.example.portfolio.domain.media;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {

    List<MediaFile> findBySiteIdOrderByCreatedAtDesc(Long siteId);
}
