package com.fracexec.api.admin.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AdminExecutiveProfileResponse(
    UUID id,
    UUID userId,
    String email,
    String fullName,
    String bio,
    String experienceSummary,
    String photoUrl,
    List<String> specialties,
    List<String> sectors,
    int availabilityDaysPerMonth,
    String profileStatus,
    // Admin always sees real company names regardless of visibility flag
    Map<String, Boolean> companyVisibilityRaw
) {}
