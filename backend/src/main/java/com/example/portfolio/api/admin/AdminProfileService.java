package com.example.portfolio.api.admin;

import com.example.portfolio.api.admin.dto.ProfileResponse;
import com.example.portfolio.api.admin.dto.ProfileUpdateRequest;
import com.example.portfolio.common.util.SlugGenerator;
import com.example.portfolio.domain.profile.PortfolioProfile;
import com.example.portfolio.domain.profile.PortfolioProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminProfileService {

    private final PortfolioProfileRepository profileRepository;
    private final SlugGenerator slugGenerator;

    public AdminProfileService(PortfolioProfileRepository profileRepository, SlugGenerator slugGenerator) {
        this.profileRepository = profileRepository;
        this.slugGenerator = slugGenerator;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        return ProfileResponse.from(findByUserId(userId));
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        PortfolioProfile profile = findByUserId(userId);
        String slug = slugGenerator.from(request.slug());
        if (profileRepository.existsBySlugAndUserIdNot(slug, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Portfolio slug already exists");
        }

        profile.update(
            slug,
            request.displayName().trim(),
            request.bio(),
            request.profileImageUrl(),
            request.theme(),
            request.publicProfile()
        );
        return ProfileResponse.from(profile);
    }

    private PortfolioProfile findByUserId(Long userId) {
        return profileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }
}
