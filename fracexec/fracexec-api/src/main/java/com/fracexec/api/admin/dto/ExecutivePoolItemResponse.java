package com.fracexec.api.admin.dto;

import java.util.List;
import java.util.UUID;

public record ExecutivePoolItemResponse(
    UUID id,
    UUID userId,
    String email,
    String fullName,
    String initials,
    List<String> specialties,
    List<String> sectors,
    int availabilityDaysPerMonth,
    String profileStatus,
    boolean isAvailable
) {}
