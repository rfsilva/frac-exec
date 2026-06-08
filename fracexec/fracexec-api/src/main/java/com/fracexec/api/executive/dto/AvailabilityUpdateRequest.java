package com.fracexec.api.executive.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AvailabilityUpdateRequest(
    @NotNull @Min(0) @Max(20) Integer availabilityDaysPerMonth,
    @NotNull String profileStatus
) {}
