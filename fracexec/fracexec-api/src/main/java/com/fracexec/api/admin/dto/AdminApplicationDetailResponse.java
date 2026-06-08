package com.fracexec.api.admin.dto;

import com.fracexec.api.executive.dto.ApplicationDetailResponse;
import com.fracexec.api.executive.model.ApplicationStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminApplicationDetailResponse(
    UUID id,
    String fullName,
    String email,
    String linkedinUrl,
    String motivation,
    ApplicationStatus status,
    Instant createdAt,
    String adminNotes,
    String supportDocumentUrl,
    // P4: campos adicionados para contexto de rejeição
    String rejectionReason,
    Instant canReapplyAfter,
    List<ApplicationDetailResponse.PositionDetail> positions,
    List<ApplicationDetailResponse.ReferenceDetail> references
) {}
