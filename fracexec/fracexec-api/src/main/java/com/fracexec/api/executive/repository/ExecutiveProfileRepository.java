package com.fracexec.api.executive.repository;

import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.SpecialtyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ExecutiveProfileRepository extends JpaRepository<ExecutiveProfile, UUID> {
    Optional<ExecutiveProfile> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);

    @Query("""
        SELECT DISTINCT ep FROM ExecutiveProfile ep
        JOIN ep.user u
        LEFT JOIN ep.specialties es
        LEFT JOIN ep.sectors ec
        WHERE ep.bio IS NOT NULL AND ep.bio != ''
          AND SIZE(ep.specialties) > 0
          AND (:specialty IS NULL OR es.specialty = :specialty)
          AND (:minAvailability IS NULL OR ep.availabilityDaysPerMonth >= :minAvailability)
          AND (:sector IS NULL OR ec.sectorName = :sector)
          AND (:profileStatus IS NULL OR CAST(ep.profileStatus AS string) = :profileStatus)
        """)
    Page<ExecutiveProfile> findCompleteProfilesWithFilters(
        @Param("specialty") SpecialtyType specialty,
        @Param("minAvailability") Integer minAvailability,
        @Param("sector") String sector,
        @Param("profileStatus") String profileStatus,
        Pageable pageable);
}
