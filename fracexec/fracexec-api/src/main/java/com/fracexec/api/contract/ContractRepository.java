package com.fracexec.api.contract;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractRepository extends JpaRepository<Contract, UUID> {
    Optional<Contract> findByEngagement(Engagement engagement);

    @Query("SELECT c FROM Contract c WHERE c.engagement.need.company.id = :companyId")
    List<Contract> findAllByCompanyId(@Param("companyId") UUID companyId);
}
