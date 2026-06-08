package com.fracexec.api.match.dto;

import java.time.Instant;
import java.util.UUID;

public record OpportunityResponse(
    UUID    id,
    UUID    needId,
    String  cLevelType,
    String  scopeDaysPerMonth,
    String  estimatedDuration,
    String  challengeSummary,
    String  companySector,
    String  companyEmployeeRange,
    String  status,
    Instant expiresAt,
    boolean canRetract
) {}
