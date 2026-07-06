package com.example.portfolio.api.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderProjectsRequest(
    @NotEmpty List<Long> projectIds
) {
}
