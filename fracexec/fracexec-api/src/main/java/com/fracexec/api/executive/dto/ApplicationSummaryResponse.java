package com.fracexec.api.executive.dto;

import com.fracexec.api.executive.model.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record ApplicationSummaryResponse(
    UUID id,
    String fullName,
    String email,
    ApplicationStatus status,
    Instant createdAt
) {}
