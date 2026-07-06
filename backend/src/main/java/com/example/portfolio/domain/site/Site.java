package com.example.portfolio.domain.site;

import com.example.portfolio.common.BaseTimeEntity;
import com.example.portfolio.domain.theme.Theme;
import com.example.portfolio.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "sites")
public class Site extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theme_id")
    private Theme theme;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "is_published", nullable = false)
    private boolean published = true;

    protected Site() {
    }

    public Site(String slug, String title) {
        this.slug = slug;
        this.title = title;
    }

    public void update(String slug, String title, String description, String profileImageUrl, boolean published, Theme theme) {
        this.slug = slug;
        this.title = title;
        this.description = description;
        this.profileImageUrl = profileImageUrl;
        this.published = published;
        this.theme = theme;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Theme getTheme() {
        return theme;
    }

    public String getSlug() {
        return slug;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public boolean isPublished() {
        return published;
    }
}
