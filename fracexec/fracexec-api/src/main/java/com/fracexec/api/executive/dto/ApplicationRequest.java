package com.fracexec.api.executive.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ApplicationRequest(
    @NotBlank String fullName,

    @NotBlank @Email String email,

    @NotBlank
    @Pattern(
        regexp = "^https://(www\\.)?linkedin\\.com/in/.+",
        message = "URL do LinkedIn inválida. Use o formato: https://linkedin.com/in/seu-perfil"
    )
    String linkedinUrl,

    @Size(min = 1, message = "Adicione ao menos 1 cargo no histórico C-Level")
    @NotNull
    @Valid
    List<ApplicationPositionDto> positions,

    @NotEmpty
    @Size(min = 2, message = "Mínimo de 2 referências obrigatório")
    @Valid
    List<ApplicationReferenceDto> references,

    @NotBlank String motivation,

    @AssertTrue(message = "O consentimento LGPD é obrigatório para enviar a candidatura")
    boolean lgpdConsent
) {}
