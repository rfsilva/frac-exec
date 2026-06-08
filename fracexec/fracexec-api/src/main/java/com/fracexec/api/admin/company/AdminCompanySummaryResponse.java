package com.fracexec.api.admin.company;

import java.time.Instant;
import java.util.UUID;

public record AdminCompanySummaryResponse(
    UUID    id,
    String  legalName,
    String  cnpj,
    String  responsibleName,
    String  responsibleEmail,
    String  status,
    Instant createdAt
) {}
