package com.fracexec.api.executive.dto;

import com.fracexec.api.executive.model.ApplicationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ApplicationDetailResponse(
    UUID id,
    String fullName,
    String email,
    String linkedinUrl,
    String motivation,
    ApplicationStatus status,
    Instant createdAt,
    List<PositionDetail> positions,
    List<ReferenceDetail> references
) {
    public record PositionDetail(
        String roleTitle,
        String companyName,
        LocalDate periodStart,
        LocalDate periodEnd,
        String teamSize,
        String revenueManaged
    ) {}

    public record ReferenceDetail(
        String refName,
        String refRole,
        String refContact
    ) {}
}
