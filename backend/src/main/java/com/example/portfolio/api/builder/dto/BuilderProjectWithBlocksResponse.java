package com.example.portfolio.api.builder.dto;

import com.example.portfolio.domain.block.Block;
import com.example.portfolio.domain.builderproject.BuilderProject;
import java.util.List;

public record BuilderProjectWithBlocksResponse(
    BuilderProjectResponse project,
    List<BlockResponse> blocks
) {
    public static BuilderProjectWithBlocksResponse from(BuilderProject project, List<Block> blocks) {
        return new BuilderProjectWithBlocksResponse(
            BuilderProjectResponse.from(project),
            blocks.stream().map(BlockResponse::from).toList()
        );
    }
}
