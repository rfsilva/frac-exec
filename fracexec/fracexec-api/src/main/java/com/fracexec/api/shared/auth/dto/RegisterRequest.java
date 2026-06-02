package com.fracexec.api.shared.auth.dto;

import com.fracexec.api.shared.auth.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres") String password,
    @NotNull Role role
) {}
