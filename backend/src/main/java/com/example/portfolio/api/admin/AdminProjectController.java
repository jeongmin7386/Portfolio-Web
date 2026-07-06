package com.example.portfolio.api.admin;

import com.example.portfolio.api.admin.dto.ProjectRequest;
import com.example.portfolio.api.admin.dto.ProjectResponse;
import com.example.portfolio.api.admin.dto.ReorderProjectsRequest;
import com.example.portfolio.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/projects")
public class AdminProjectController {

    private final AdminProjectService projectService;

    public AdminProjectController(AdminProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    List<ProjectResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return projectService.list(principal.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ProjectResponse create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ProjectRequest request) {
        return projectService.create(principal.getId(), request);
    }

    @GetMapping("/{projectId}")
    ProjectResponse get(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long projectId) {
        return projectService.get(principal.getId(), projectId);
    }

    @PatchMapping("/{projectId}")
    ProjectResponse update(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long projectId,
        @Valid @RequestBody ProjectRequest request
    ) {
        return projectService.update(principal.getId(), projectId, request);
    }

    @PostMapping("/{projectId}/thumbnail")
    ProjectResponse uploadThumbnail(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long projectId,
        @RequestParam("file") MultipartFile file
    ) {
        return projectService.uploadThumbnail(principal.getId(), projectId, file);
    }

    @PatchMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reorder(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ReorderProjectsRequest request) {
        projectService.reorder(principal.getId(), request);
    }

    @DeleteMapping("/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long projectId) {
        projectService.delete(principal.getId(), projectId);
    }
}
