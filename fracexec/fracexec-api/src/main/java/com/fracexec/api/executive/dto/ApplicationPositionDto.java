package com.fracexec.api.executive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ApplicationPositionDto(
    @NotBlank String roleTitle,
    String companyName,
    @NotNull LocalDate periodStart,
    LocalDate periodEnd,
    String teamSize,
    String revenueManaged
) {}
