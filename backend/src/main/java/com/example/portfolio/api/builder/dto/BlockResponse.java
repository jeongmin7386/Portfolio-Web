package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.block.Block;
import com.example.portfolio.domain.block.BlockType;
import java.util.Map;

public record BlockResponse(
    Long id,
    Long pageId,
    Long projectId,
    BlockType blockType,
    Map<String, Object> content,
    Map<String, Object> settings,
    int sortOrder,
    boolean visible
) {
    public static BlockResponse from(Block block) {
        return new BlockResponse(
            block.getId(),
            block.getPage() == null ? null : block.getPage().getId(),
            block.getProject() == null ? null : block.getProject().getId(),
            block.getBlockType(),
            block.getContent(),
            block.getSettings(),
            block.getSortOrder(),
            block.isVisible()
        );
    }
}
