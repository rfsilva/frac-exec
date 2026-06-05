package com.fracexec.api.match.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AddExecutiveRequest(@NotNull UUID executiveProfileId) {}
