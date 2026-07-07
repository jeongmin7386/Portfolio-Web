package com.example.portfolio.api.builder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BulkBlockRequest(
    @NotNull List<@Valid BlockRequest> blocks
) {
}
