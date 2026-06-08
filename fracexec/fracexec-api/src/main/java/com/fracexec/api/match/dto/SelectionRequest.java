package com.fracexec.api.match.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SelectionRequest(
    @NotEmpty
    @Size(max = 2, message = "Selecione no máximo 2 executivos.")
    List<UUID> selectedExecutiveIds
) {}
