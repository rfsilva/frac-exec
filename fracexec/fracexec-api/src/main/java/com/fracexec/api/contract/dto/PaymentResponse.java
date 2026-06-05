package com.fracexec.api.contract.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
    UUID       id,
    UUID       engagementId,
    String     referenceMonth,
    BigDecimal grossAmount,
    BigDecimal feeAmount,
    BigDecimal netAmount,
    String     status,
    Instant    paidAt,
    Instant    estimatedTransferAt,
    Instant    transferredAt
) {}
