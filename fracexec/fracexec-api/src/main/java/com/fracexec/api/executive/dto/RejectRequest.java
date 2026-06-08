package com.fracexec.api.executive.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectRequest(
    @NotBlank String rejectionReason
) {}
