package com.fracexec.api.executive.repository;

import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
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

    // B1: EXISTS subqueries instead of LEFT JOIN to avoid DISTINCT overcounting
    // B2: completeness (bio + specialties) checked inline, consistent with ExecutiveProfile.isComplete()
    // P5: profileStatus compared as enum type — no CAST needed
    @Query("""
        SELECT ep FROM ExecutiveProfile ep
        JOIN ep.user u
        WHERE ep.bio IS NOT NULL AND ep.bio != ''
          AND EXISTS (SELECT 1 FROM ExecutiveSpecialty es WHERE es.profile = ep)
          AND (:specialty IS NULL OR EXISTS (
              SELECT 1 FROM ExecutiveSpecialty es2 WHERE es2.profile = ep AND es2.specialty = :specialty))
          AND (:minAvailability IS NULL OR ep.availabilityDaysPerMonth >= :minAvailability)
          AND (:sector IS NULL OR EXISTS (
              SELECT 1 FROM ExecutiveSector ec WHERE ec.profile = ep AND ec.sectorName = :sector))
          AND (:profileStatus IS NULL OR ep.profileStatus = :profileStatus)
        ORDER BY ep.createdAt DESC
        """)
    Page<ExecutiveProfile> findCompleteProfilesWithFilters(
        @Param("specialty") SpecialtyType specialty,
        @Param("minAvailability") Integer minAvailability,
        @Param("sector") String sector,
        @Param("profileStatus") ProfileStatus profileStatus,
        Pageable pageable);
}
