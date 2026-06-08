package com.fracexec.api.company;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NeedRepository extends JpaRepository<Need, UUID> {

    boolean existsByCompanyAndStatusIn(Company company, List<NeedStatus> statuses);

    Optional<Need> findTopByCompanyAndStatusInOrderByCreatedAtDesc(
            Company company, List<NeedStatus> statuses);

    @Query("""
        SELECT n FROM Need n JOIN n.company c
        WHERE (:filterStatus = false OR n.status = :status)
        AND (:filterCLevel = false OR n.cLevelType = :cLevelType)
        AND (:filterSector = false OR LOWER(c.sector) LIKE LOWER(CONCAT('%', CAST(:sector AS string), '%')))
        AND (:filterDateFrom = false OR n.createdAt >= :dateFrom)
        AND (:filterDateTo = false OR n.createdAt <= :dateTo)
        ORDER BY n.createdAt DESC""")
    Page<Need> findWithFilters(
        @Param("filterStatus")   boolean filterStatus,   @Param("status")   NeedStatus status,
        @Param("filterCLevel")   boolean filterCLevel,   @Param("cLevelType") String cLevelType,
        @Param("filterSector")   boolean filterSector,   @Param("sector")   String sector,
        @Param("filterDateFrom") boolean filterDateFrom, @Param("dateFrom") Instant dateFrom,
        @Param("filterDateTo")   boolean filterDateTo,   @Param("dateTo")   Instant dateTo,
        Pageable pageable);
}
