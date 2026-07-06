package com.example.portfolio.api.builder;

import com.example.portfolio.api.builder.dto.BlockRequest;
import com.example.portfolio.api.builder.dto.BlockResponse;
import com.example.portfolio.api.builder.dto.BuilderProjectRequest;
import com.example.portfolio.api.builder.dto.BuilderProjectResponse;
import com.example.portfolio.api.builder.dto.BuilderProjectWithBlocksResponse;
import com.example.portfolio.api.builder.dto.BulkBlockRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
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

    @GetMapping("/projects")
    List<BuilderProjectResponse> listProjects() {
        return builderService.listProjects();
    }

    @PostMapping("/projects")
    @ResponseStatus(HttpStatus.CREATED)
    BuilderProjectResponse createProject(@Valid @RequestBody BuilderProjectRequest request) {
        return builderService.createProject(request);
    }

    @GetMapping("/projects/{projectId}")
    BuilderProjectWithBlocksResponse getProject(@PathVariable Long projectId) {
        return builderService.getProject(projectId);
    }

    @PatchMapping("/projects/{projectId}")
    BuilderProjectResponse updateProject(@PathVariable Long projectId, @Valid @RequestBody BuilderProjectRequest request) {
        return builderService.updateProject(projectId, request);
    }

    @DeleteMapping("/projects/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteProject(@PathVariable Long projectId) {
        builderService.deleteProject(projectId);
    }

    @PatchMapping("/projects/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reorderProjects(@Valid @RequestBody ReorderItemsRequest request) {
        builderService.reorderProjects(request);
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

    @PutMapping("/pages/{pageId}/blocks")
    List<BlockResponse> saveBlocks(@PathVariable Long pageId, @Valid @RequestBody BulkBlockRequest request) {
        return builderService.saveBlocks(pageId, request);
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

    @GetMapping("/projects/{projectId}/blocks")
    List<BlockResponse> listProjectBlocks(@PathVariable Long projectId) {
        return builderService.listProjectBlocks(projectId);
    }

    @PostMapping("/projects/{projectId}/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    BlockResponse createProjectBlock(@PathVariable Long projectId, @Valid @RequestBody BlockRequest request) {
        return builderService.createProjectBlock(projectId, request);
    }

    @PatchMapping("/projects/{projectId}/blocks/{blockId}")
    BlockResponse updateProjectBlock(@PathVariable Long projectId, @PathVariable Long blockId, @Valid @RequestBody BlockRequest request) {
        return builderService.updateProjectBlock(projectId, blockId, request);
    }

    @PutMapping("/projects/{projectId}/blocks")
    List<BlockResponse> saveProjectBlocks(@PathVariable Long projectId, @Valid @RequestBody BulkBlockRequest request) {
        return builderService.saveProjectBlocks(projectId, request);
    }

    @DeleteMapping("/projects/{projectId}/blocks/{blockId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteProjectBlock(@PathVariable Long projectId, @PathVariable Long blockId) {
        builderService.deleteProjectBlock(projectId, blockId);
    }

    @PatchMapping("/projects/{projectId}/blocks/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reorderProjectBlocks(@PathVariable Long projectId, @Valid @RequestBody ReorderItemsRequest request) {
        builderService.reorderProjectBlocks(projectId, request);
    }
}
