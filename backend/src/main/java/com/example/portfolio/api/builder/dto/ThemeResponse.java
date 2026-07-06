package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.theme.Theme;
import java.util.Map;

public record ThemeResponse(
    Long id,
    String name,
    Map<String, Object> settings
) {
    public static ThemeResponse from(Theme theme) {
        return new ThemeResponse(theme.getId(), theme.getName(), theme.getSettings());
    }
}
