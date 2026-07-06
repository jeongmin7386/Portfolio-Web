package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.block.BlockType;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record BlockRequest(
    @NotNull BlockType blockType,
    Map<String, Object> content,
    Map<String, Object> settings,
    Boolean visible,
    Integer sortOrder
) {
}
