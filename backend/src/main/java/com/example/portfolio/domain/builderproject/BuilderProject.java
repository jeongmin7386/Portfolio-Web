package com.example.portfolio.domain.builderproject;

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
import java.util.Arrays;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
    name = "builder_projects",
    uniqueConstraints = @UniqueConstraint(name = "uk_builder_projects_site_slug", columnNames = {"site_id", "slug"})
)
public class BuilderProject extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 200)
    private String slug;

    @Column(length = 240)
    private String subtitle;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(columnDefinition = "text")
    private String description;

    @Column(length = 120)
    private String period;

    @Column(length = 160)
    private String role;

    @Column(length = 120)
    private String contribution;

    @Column(length = 120)
    private String category;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tech_stacks", columnDefinition = "text[]", nullable = false)
    private String[] techStacks = new String[0];

    @Column(name = "github_url", length = 500)
    private String githubUrl;

    @Column(name = "live_url", length = 500)
    private String liveUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BuilderProjectVisibility visibility = BuilderProjectVisibility.PUBLIC;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "seo_title", length = 180)
    private String seoTitle;

    @Column(name = "seo_description", length = 300)
    private String seoDescription;

    protected BuilderProject() {
    }

    public BuilderProject(Site site, String title, String slug, int sortOrder) {
        this.site = site;
        this.title = title;
        this.slug = slug;
        this.sortOrder = sortOrder;
    }

    public void update(
        String title,
        String slug,
        String subtitle,
        String summary,
        String description,
        String period,
        String role,
        String contribution,
        String category,
        String thumbnailUrl,
        String[] techStacks,
        String githubUrl,
        String liveUrl,
        BuilderProjectVisibility visibility,
        int sortOrder,
        String seoTitle,
        String seoDescription
    ) {
        this.title = title;
        this.slug = slug;
        this.subtitle = subtitle;
        this.summary = summary;
        this.description = description;
        this.period = period;
        this.role = role;
        this.contribution = contribution;
        this.category = category;
        this.thumbnailUrl = thumbnailUrl;
        this.techStacks = techStacks == null ? new String[0] : Arrays.copyOf(techStacks, techStacks.length);
        this.githubUrl = githubUrl;
        this.liveUrl = liveUrl;
        this.visibility = visibility == null ? BuilderProjectVisibility.PUBLIC : visibility;
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

    public String getSubtitle() {
        return subtitle;
    }

    public String getSummary() {
        return summary;
    }

    public String getDescription() {
        return description;
    }

    public String getPeriod() {
        return period;
    }

    public String getRole() {
        return role;
    }

    public String getContribution() {
        return contribution;
    }

    public String getCategory() {
        return category;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public String[] getTechStacks() {
        return Arrays.copyOf(techStacks, techStacks.length);
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public String getLiveUrl() {
        return liveUrl;
    }

    public BuilderProjectVisibility getVisibility() {
        return visibility;
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
