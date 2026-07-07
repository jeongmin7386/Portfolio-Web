package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.block.BlockType;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record BlockRequest(
    Long id,
    @NotNull BlockType blockType,
    String sectionId,
    Map<String, Object> content,
    Map<String, Object> settings,
    Map<String, Object> styles,
    Map<String, Object> layout,
    Boolean visible,
    Integer sortOrder
) {
}
