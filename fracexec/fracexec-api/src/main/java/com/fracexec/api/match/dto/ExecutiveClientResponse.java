package com.fracexec.api.match.dto;

import java.time.Instant;
import java.util.UUID;

public record ExecutiveClientResponse(
    UUID    id,
    String  cnae2digit,
    String  regionState,
    String  regionCity,
    String  companySizeRange,
    Instant createdAt
) {}
