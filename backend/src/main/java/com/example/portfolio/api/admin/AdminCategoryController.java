package com.example.portfolio.api.admin;

import com.example.portfolio.api.admin.dto.CategoryRequest;
import com.example.portfolio.api.admin.dto.CategoryResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    private final AdminCategoryService categoryService;

    public AdminCategoryController(AdminCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    List<CategoryResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return categoryService.list(principal.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CategoryResponse create(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CategoryRequest request) {
        return categoryService.create(principal.getId(), request);
    }

    @PatchMapping("/{categoryId}")
    CategoryResponse update(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long categoryId,
        @Valid @RequestBody CategoryRequest request
    ) {
        return categoryService.update(principal.getId(), categoryId, request);
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long categoryId) {
        categoryService.delete(principal.getId(), categoryId);
    }
}
