package com.fracexec.api.contract;

import com.fracexec.api.company.Need;
import com.fracexec.api.executive.model.ExecutiveProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EngagementRepository extends JpaRepository<Engagement, UUID> {
    Optional<Engagement>  findByNeed(Need need);
    List<Engagement>      findAllByExecutiveProfile(ExecutiveProfile profile);
    List<Engagement>      findAllByExecutiveProfileAndStatus(ExecutiveProfile profile, EngagementStatus status);
}
