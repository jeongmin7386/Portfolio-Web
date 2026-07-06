package com.example.portfolio.api.admin;

import com.example.portfolio.api.admin.dto.CategoryRequest;
import com.example.portfolio.api.admin.dto.CategoryResponse;
import com.example.portfolio.common.util.SlugGenerator;
import com.example.portfolio.domain.category.Category;
import com.example.portfolio.domain.category.CategoryRepository;
import com.example.portfolio.domain.user.User;
import com.example.portfolio.domain.user.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final SlugGenerator slugGenerator;

    public AdminCategoryService(CategoryRepository categoryRepository, UserRepository userRepository, SlugGenerator slugGenerator) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.slugGenerator = slugGenerator;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(Long userId) {
        return categoryRepository.findByUserIdOrderBySortOrderAscNameAsc(userId)
            .stream()
            .map(CategoryResponse::from)
            .toList();
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String slug = slugGenerator.unique(request.name(), candidate -> categoryRepository.existsByUserIdAndSlug(userId, candidate));
        Category category = categoryRepository.save(new Category(
            user,
            request.name().trim(),
            slug,
            request.sortOrder() == null ? 0 : request.sortOrder()
        ));
        return CategoryResponse.from(category);
    }

    @Transactional
    public CategoryResponse update(Long userId, Long categoryId, CategoryRequest request) {
        Category category = findByIdAndUserId(categoryId, userId);
        String slug = slugGenerator.from(request.name());
        if (categoryRepository.existsByUserIdAndSlugAndIdNot(userId, slug, categoryId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category slug already exists");
        }
        category.update(request.name().trim(), slug, request.sortOrder() == null ? category.getSortOrder() : request.sortOrder());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long userId, Long categoryId) {
        Category category = findByIdAndUserId(categoryId, userId);
        categoryRepository.delete(category);
    }

    private Category findByIdAndUserId(Long categoryId, Long userId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }
}
