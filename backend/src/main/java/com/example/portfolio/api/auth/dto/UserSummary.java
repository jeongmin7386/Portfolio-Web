package com.example.portfolio.api.auth.dto;

import com.example.portfolio.domain.user.User;

public record UserSummary(
    Long id,
    String email,
    String name
) {

    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getEmail(), user.getName());
    }
}
