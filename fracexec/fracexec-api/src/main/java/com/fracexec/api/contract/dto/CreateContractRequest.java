package com.fracexec.api.contract.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateContractRequest(
    @NotNull UUID    needId,
    @NotNull UUID    executiveProfileId,
    @NotNull @DecimalMin("0.01") BigDecimal monthlyValue,
    @NotNull Integer scopeDaysPerMonth,
    Integer durationMonths
) {}
