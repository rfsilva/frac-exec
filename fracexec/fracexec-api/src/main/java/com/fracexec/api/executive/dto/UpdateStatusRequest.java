package com.fracexec.api.executive.dto;

import com.fracexec.api.executive.model.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

// B2: Apenas UNDER_REVIEW é aceito neste endpoint (transição PENDING→UNDER_REVIEW).
// Story 2.3 expandirá para suportar APPROVED e REJECTED.
// Mantemos o tipo como ApplicationStatus para reuso futuro, mas a service-layer
// valida a transição via ALLOWED_TRANSITIONS; aqui exigimos apenas não-nulo.
public record UpdateStatusRequest(
    @NotNull ApplicationStatus status
) {}
