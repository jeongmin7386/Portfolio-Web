package com.example.portfolio.api.builder.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderItemsRequest(
    @NotEmpty List<Long> ids
) {
}
