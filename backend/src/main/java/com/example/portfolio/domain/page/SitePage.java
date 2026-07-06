package com.example.portfolio.domain.page;

import com.example.portfolio.common.BaseTimeEntity;
import com.example.portfolio.domain.site.Site;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "pages",
    uniqueConstraints = @UniqueConstraint(name = "uk_pages_site_slug", columnNames = {"site_id", "slug"})
)
public class SitePage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 160)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "page_type", nullable = false, length = 40)
    private PageType pageType = PageType.CUSTOM;

    @Column(name = "is_public", nullable = false)
    private boolean publicPage = true;

    @Column(name = "nav_visible", nullable = false)
    private boolean navVisible = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "seo_title", length = 180)
    private String seoTitle;

    @Column(name = "seo_description", length = 300)
    private String seoDescription;

    protected SitePage() {
    }

    public SitePage(Site site, String title, String slug, PageType pageType, int sortOrder) {
        this.site = site;
        this.title = title;
        this.slug = slug;
        this.pageType = pageType == null ? PageType.CUSTOM : pageType;
        this.sortOrder = sortOrder;
    }

    public void update(String title, String slug, PageType pageType, boolean publicPage, boolean navVisible, int sortOrder,
                       String seoTitle, String seoDescription) {
        this.title = title;
        this.slug = slug;
        this.pageType = pageType == null ? PageType.CUSTOM : pageType;
        this.publicPage = publicPage;
        this.navVisible = navVisible;
        this.sortOrder = sortOrder;
        this.seoTitle = seoTitle;
        this.seoDescription = seoDescription;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public Site getSite() {
        return site;
    }

    public String getTitle() {
        return title;
    }

    public String getSlug() {
        return slug;
    }

    public PageType getPageType() {
        return pageType;
    }

    public boolean isPublicPage() {
        return publicPage;
    }

    public boolean isNavVisible() {
        return navVisible;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public String getSeoTitle() {
        return seoTitle;
    }

    public String getSeoDescription() {
        return seoDescription;
    }
}
