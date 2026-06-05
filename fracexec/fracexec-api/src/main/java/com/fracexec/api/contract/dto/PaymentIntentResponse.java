package com.fracexec.api.contract.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentIntentResponse(
    UUID      paymentId,
    String    clientSecret,
    String    pixCode,
    BigDecimal grossAmount,
    BigDecimal feeAmount,
    BigDecimal netAmount,
    Instant   expiresAt
) {}
