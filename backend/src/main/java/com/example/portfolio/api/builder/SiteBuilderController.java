package com.example.portfolio.api.builder;

import com.example.portfolio.api.builder.dto.BlockRequest;
import com.example.portfolio.api.builder.dto.BlockResponse;
import com.example.portfolio.api.builder.dto.BuilderStateResponse;
import com.example.portfolio.api.builder.dto.PageRequest;
import com.example.portfolio.api.builder.dto.PageResponse;
import com.example.portfolio.api.builder.dto.PageWithBlocksResponse;
import com.example.portfolio.api.builder.dto.ReorderItemsRequest;
import com.example.portfolio.api.builder.dto.SiteRequest;
import com.example.portfolio.api.builder.dto.SiteResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/builder")
public class SiteBuilderController {

    private final SiteBuilderService builderService;

    public SiteBuilderController(SiteBuilderService builderService) {
        this.builderService = builderService;
    }

    @GetMapping
    BuilderStateResponse getState() {
        return builderService.getState();
    }

    @PatchMapping("/site")
    SiteResponse updateSite(@Valid @RequestBody SiteRequest request) {
        return builderService.updateSite(request);
    }

    @GetMapping("/pages")
    List<PageResponse> listPages() {
        return builderService.listPages();
    }

    @PostMapping("/pages")
    @ResponseStatus(HttpStatus.CREATED)
    PageResponse createPage(@Valid @RequestBody PageRequest request) {
        return builderService.createPage(request);
    }

    @GetMapping("/pages/{pageId}")
    PageWithBlocksResponse getPage(@PathVariable Long pageId) {
        return builderService.getPage(pageId);
    }

    @PatchMapping("/pages/{pageId}")
    PageResponse updatePage(@PathVariable Long pageId, @Valid @RequestBody PageRequest request) {
        return builderService.updatePage(pageId, request);
    }

    @DeleteMapping("/pages/{pageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deletePage(@PathVariable Long pageId) {
        builderService.deletePage(pageId);
    }

    @PatchMapping("/pages/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reorderPages(@Valid @RequestBody ReorderItemsRequest request) {
        builderService.reorderPages(request);
    }

    @GetMapping("/pages/{pageId}/blocks")
    List<BlockResponse> listBlocks(@PathVariable Long pageId) {
        return builderService.listBlocks(pageId);
    }

    @PostMapping("/pages/{pageId}/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    BlockResponse createBlock(@PathVariable Long pageId, @Valid @RequestBody BlockRequest request) {
        return builderService.createBlock(pageId, request);
    }

    @PatchMapping("/pages/{pageId}/blocks/{blockId}")
    BlockResponse updateBlock(@PathVariable Long pageId, @PathVariable Long blockId, @Valid @RequestBody BlockRequest request) {
        return builderService.updateBlock(pageId, blockId, request);
    }

    @DeleteMapping("/pages/{pageId}/blocks/{blockId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteBlock(@PathVariable Long pageId, @PathVariable Long blockId) {
        builderService.deleteBlock(pageId, blockId);
    }

    @PatchMapping("/pages/{pageId}/blocks/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reorderBlocks(@PathVariable Long pageId, @Valid @RequestBody ReorderItemsRequest request) {
        builderService.reorderBlocks(pageId, request);
    }
}
