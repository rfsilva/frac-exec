package com.fracexec.api.match.dto;

import jakarta.validation.constraints.NotBlank;

public record ConflictDecisionRequest(
    @NotBlank String decision  // "EXCLUDE" | "APPROVE_WITH_ALERT"
) {}
