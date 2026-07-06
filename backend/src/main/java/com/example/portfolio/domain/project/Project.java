package com.example.portfolio.domain.project;

import com.example.portfolio.common.BaseTimeEntity;
import com.example.portfolio.domain.category.Category;
import com.example.portfolio.domain.user.User;
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
    name = "projects",
    uniqueConstraints = @UniqueConstraint(name = "uk_projects_user_slug", columnNames = {"user_id", "slug"})
)
public class Project extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 200)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

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
    private ProjectVisibility visibility = ProjectVisibility.PRIVATE;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected Project() {
    }

    public Project(User user, Category category, String title, String slug) {
        this.user = user;
        this.category = category;
        this.title = title;
        this.slug = slug;
    }

    public void update(Category category, String title, String slug, String description, String[] techStacks, String githubUrl,
                       String liveUrl, ProjectVisibility visibility, int sortOrder) {
        this.category = category;
        this.title = title;
        this.slug = slug;
        this.description = description;
        this.techStacks = techStacks == null ? new String[0] : techStacks;
        this.githubUrl = githubUrl;
        this.liveUrl = liveUrl;
        this.visibility = visibility == null ? ProjectVisibility.PRIVATE : visibility;
        this.sortOrder = sortOrder;
    }

    public void updateThumbnail(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Category getCategory() {
        return category;
    }

    public String getTitle() {
        return title;
    }

    public String getSlug() {
        return slug;
    }

    public String getDescription() {
        return description;
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

    public ProjectVisibility getVisibility() {
        return visibility;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
