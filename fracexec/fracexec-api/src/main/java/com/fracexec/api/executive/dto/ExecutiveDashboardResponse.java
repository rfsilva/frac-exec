package com.fracexec.api.executive.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ExecutiveDashboardResponse(
    long          activeEngagementsCount,
    int           committedDaysMonth,
    BigDecimal    nextTransferAmount,
    long          pendingOpportunitiesCount,
    List<EngagementSummary> activeEngagements,
    OpportunityPreview recentOpportunity
) {
    public record EngagementSummary(UUID id, String companyName, String cLevelType, int scopeDaysPerMonth, String status) {}
    public record OpportunityPreview(UUID id, String cLevelType, String companySector, String status) {}
}
