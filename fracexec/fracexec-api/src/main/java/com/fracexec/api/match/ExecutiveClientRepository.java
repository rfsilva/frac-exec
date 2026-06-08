package com.fracexec.api.match;

import com.fracexec.api.executive.model.ExecutiveProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExecutiveClientRepository extends JpaRepository<ExecutiveClient, UUID> {

    List<ExecutiveClient> findAllByExecutiveProfile(ExecutiveProfile profile);

    boolean existsByExecutiveProfileAndCnae2digitAndRegionState(
            ExecutiveProfile profile, String cnae2digit, String regionState);
}
