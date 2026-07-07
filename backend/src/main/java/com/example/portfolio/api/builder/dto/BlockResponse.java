package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.block.Block;
import com.example.portfolio.domain.block.BlockType;
import java.util.Map;

public record BlockResponse(
    Long id,
    Long pageId,
    Long projectId,
    BlockType blockType,
    String sectionId,
    Map<String, Object> content,
    Map<String, Object> settings,
    Map<String, Object> styles,
    Map<String, Object> layout,
    int sortOrder,
    boolean visible
) {
    public static BlockResponse from(Block block) {
        return new BlockResponse(
            block.getId(),
            block.getPage() == null ? null : block.getPage().getId(),
            block.getProject() == null ? null : block.getProject().getId(),
            block.getBlockType(),
            block.getSectionId(),
            block.getContent(),
            block.getSettings(),
            block.getStyles(),
            block.getLayout(),
            block.getSortOrder(),
            block.isVisible()
        );
    }
}
