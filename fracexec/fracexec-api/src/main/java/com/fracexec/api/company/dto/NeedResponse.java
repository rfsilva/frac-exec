package com.fracexec.api.company.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record NeedResponse(
    UUID      id,
    String    cLevelType,
    String    scopeDaysPerMonth,
    String    estimatedDuration,
    LocalDate desiredStart,
    String    challengeDescription,
    String    expectedResult,
    String    status,
    Instant   createdAt,
    Instant   slaDeadline
) {}
