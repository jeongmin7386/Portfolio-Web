package com.example.portfolio.api.admin;

import com.example.portfolio.api.admin.dto.ProfileResponse;
import com.example.portfolio.api.admin.dto.ProfileUpdateRequest;
import com.example.portfolio.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/profile")
public class AdminProfileController {

    private final AdminProfileService profileService;

    public AdminProfileController(AdminProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    ProfileResponse getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return profileService.getProfile(principal.getId());
    }

    @PatchMapping
    ProfileResponse updateProfile(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.updateProfile(principal.getId(), request);
    }
}
