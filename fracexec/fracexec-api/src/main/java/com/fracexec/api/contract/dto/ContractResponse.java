package com.fracexec.api.contract.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ContractResponse(
    UUID      id,
    UUID      engagementId,
    UUID      needId,
    String    companyName,
    String    executiveEmail,
    BigDecimal monthlyValue,
    Integer   scopeDaysPerMonth,
    Integer   durationMonths,
    boolean   signedByPme,
    boolean   signedByExecutive,
    boolean   fullySigned,
    String    downloadUrl,
    Instant   generatedAt,
    Instant   fullySignedAt
) {}
