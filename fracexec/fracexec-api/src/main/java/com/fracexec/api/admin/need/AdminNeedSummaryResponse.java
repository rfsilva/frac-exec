package com.fracexec.api.admin.need;

import java.time.Instant;
import java.util.UUID;

public record AdminNeedSummaryResponse(
    UUID    id,
    String  companyLegalName,
    String  cLevelType,
    String  scopeDaysPerMonth,
    String  estimatedDuration,
    String  status,
    Instant createdAt
) {}
