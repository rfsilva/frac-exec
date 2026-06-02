package com.fracexec.api.executive.dto;

import com.fracexec.api.executive.model.ProfileStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ExecutiveProfileResponse(
    UUID id,
    String bio,
    String experienceSummary,
    String photoUrl,
    List<String> specialties,
    List<String> sectors,
    // AC-2: map of companyName → visible (true = show, false = anonymize)
    Map<String, Boolean> companyVisibility,
    // AC-2: list of company names from the original application, for UI rendering
    List<String> applicationCompanies,
    int availabilityDaysPerMonth,
    ProfileStatus profileStatus,
    boolean isComplete,
    Instant createdAt
) {}
