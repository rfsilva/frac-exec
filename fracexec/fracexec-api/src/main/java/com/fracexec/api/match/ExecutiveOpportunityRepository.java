package com.fracexec.api.match;

import com.fracexec.api.executive.model.ExecutiveProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ExecutiveOpportunityRepository extends JpaRepository<ExecutiveOpportunity, UUID> {

    List<ExecutiveOpportunity> findAllByExecutiveProfileAndStatusIn(
            ExecutiveProfile profile, List<OpportunityStatus> statuses);

    List<ExecutiveOpportunity> findAllByStatusAndExpiresAtBefore(
            OpportunityStatus status, Instant now);

    long countByNeedAndStatusIn(
            com.fracexec.api.company.Need need, List<OpportunityStatus> statuses);
}
