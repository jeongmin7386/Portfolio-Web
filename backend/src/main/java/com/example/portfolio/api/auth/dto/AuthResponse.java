package com.example.portfolio.api.auth.dto;

public record AuthResponse(
    String accessToken,
    UserSummary user
) {
}
