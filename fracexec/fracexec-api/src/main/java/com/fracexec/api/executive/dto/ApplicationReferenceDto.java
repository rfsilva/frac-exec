package com.fracexec.api.executive.dto;

import jakarta.validation.constraints.NotBlank;

public record ApplicationReferenceDto(
    @NotBlank String refName,
    @NotBlank String refRole,
    @NotBlank String refContact
) {}
