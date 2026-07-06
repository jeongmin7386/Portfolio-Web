package com.example.portfolio.domain.media;

import com.example.portfolio.domain.site.Site;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "media_files")
public class MediaFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "original_name", length = 255)
    private String originalName;

    @Column(name = "mime_type", length = 120)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected MediaFile() {
    }

    public MediaFile(Site site, String url, String originalName, String mimeType, Long sizeBytes, String altText) {
        this.site = site;
        this.url = url;
        this.originalName = originalName;
        this.mimeType = mimeType;
        this.sizeBytes = sizeBytes;
        this.altText = altText;
    }

    public Long getId() {
        return id;
    }

    public Site getSite() {
        return site;
    }

    public String getUrl() {
        return url;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public String getAltText() {
        return altText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
