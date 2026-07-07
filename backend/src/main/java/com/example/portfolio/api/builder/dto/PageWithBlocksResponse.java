package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.block.Block;
import com.example.portfolio.domain.page.SitePage;
import java.util.List;

public record PageWithBlocksResponse(
    PageResponse page,
    List<BlockResponse> blocks
) {
    public static PageWithBlocksResponse from(SitePage page, List<Block> blocks) {
        return new PageWithBlocksResponse(
            PageResponse.from(page),
            blocks.stream().map(BlockResponse::from).toList()
        );
    }
}
