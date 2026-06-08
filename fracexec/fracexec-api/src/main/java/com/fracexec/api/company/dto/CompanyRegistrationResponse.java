package com.fracexec.api.company.dto;

import java.util.UUID;

public record CompanyRegistrationResponse(
    UUID   companyId,
    String message
) {}
