package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.block.Block;
import com.example.portfolio.domain.block.BlockType;
import java.util.Map;

public record BlockResponse(
    Long id,
    Long pageId,
    BlockType blockType,
    Map<String, Object> content,
    int sortOrder
) {
    public static BlockResponse from(Block block) {
        return new BlockResponse(
            block.getId(),
            block.getPage().getId(),
            block.getBlockType(),
            block.getContent(),
            block.getSortOrder()
        );
    }
}
