package com.fracexec.api.company.dto;

public record CompanyDashboardResponse(
    String      companyName,
    String      companyStatus,
    NeedResponse activeNeed   // null se não houver necessidade ativa
) {}
