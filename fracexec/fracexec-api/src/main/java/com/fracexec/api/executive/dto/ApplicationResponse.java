package com.fracexec.api.executive.dto;

import com.fracexec.api.executive.model.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record ApplicationResponse(
    UUID id,
    ApplicationStatus status,
    Instant createdAt
) {}
