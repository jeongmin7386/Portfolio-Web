package com.example.portfolio.api.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
    @NotBlank @Size(max = 100) String slug,
    @NotBlank @Size(max = 100) String displayName,
    String bio,
    String profileImageUrl,
    @NotBlank @Size(max = 50) String theme,
    boolean publicProfile
) {
}
