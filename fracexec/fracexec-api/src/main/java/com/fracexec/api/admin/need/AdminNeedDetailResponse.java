package com.fracexec.api.admin.need;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AdminNeedDetailResponse(
    UUID      id,
    String    companyLegalName,
    String    companyCnpj,
    String    cLevelType,
    String    scopeDaysPerMonth,
    String    estimatedDuration,
    LocalDate desiredStart,
    String    challengeDescription,
    String    expectedResult,
    String    confidentialContext,
    String    status,
    Instant   createdAt,
    Instant   updatedAt
) {}
