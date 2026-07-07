package com.example.portfolio.domain.profile;

import com.example.portfolio.common.BaseTimeEntity;
import com.example.portfolio.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "portfolio_profiles")
public class PortfolioProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(columnDefinition = "text")
    private String bio;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(length = 50)
    private String theme = "MINIMAL_GRID";

    @Column(name = "is_public", nullable = false)
    private boolean publicProfile = true;

    protected PortfolioProfile() {
    }

    public PortfolioProfile(User user, String slug, String displayName) {
        this.user = user;
        this.slug = slug;
        this.displayName = displayName;
    }

    public void update(String slug, String displayName, String bio, String profileImageUrl, String theme, boolean publicProfile) {
        this.slug = slug;
        this.displayName = displayName;
        this.bio = bio;
        this.profileImageUrl = profileImageUrl;
        this.theme = theme;
        this.publicProfile = publicProfile;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getSlug() {
        return slug;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getBio() {
        return bio;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getTheme() {
        return theme;
    }

    public boolean isPublicProfile() {
        return publicProfile;
    }
}
