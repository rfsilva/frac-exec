package com.fracexec.api.executive.dto;

import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record SaveProfileRequest(
    @Size(max = 2000, message = "Bio deve ter no máximo 300 palavras (~2000 caracteres)")
    String bio,

    String experienceSummary,

    List<String> specialties,

    List<String> sectors,

    Map<String, Boolean> companyVisibility
) {}
