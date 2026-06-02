package com.fracexec.api.shared.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank String token,
    @NotBlank @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres") String newPassword
) {}
