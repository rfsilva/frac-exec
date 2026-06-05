package com.fracexec.api.match.dto;

import java.util.List;
import java.util.UUID;

public record ShortlistExecutiveItem(
    UUID        id,
    UUID        executiveProfileId,
    String      fullName,
    List<String> specialties,
    int         availabilityDaysPerMonth,
    String      conflictStatus,
    String      conflictDetail
) {}
