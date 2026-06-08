package com.fracexec.api.executive.repository;

import com.fracexec.api.executive.model.ApplicationStatus;
import com.fracexec.api.executive.model.ExecutiveApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExecutiveApplicationRepository extends JpaRepository<ExecutiveApplication, UUID> {

    Optional<ExecutiveApplication> findFirstByEmailAndStatusIn(String email, List<ApplicationStatus> statuses);

    @Query("SELECT a FROM ExecutiveApplication a WHERE a.email = :email AND a.status = :status ORDER BY a.createdAt DESC")
    Optional<ExecutiveApplication> findLatestByEmailAndStatus(
            @Param("email") String email,
            @Param("status") ApplicationStatus status);

    // Fix: PostgreSQL cannot infer type of NULL parameters in IS NULL checks.
    // Solution: use boolean flags to skip filters when value is absent.
    // This avoids the "could not determine data type of parameter" error.
    @Query("""
            SELECT a FROM ExecutiveApplication a
            WHERE (:filterStatus = false OR a.status = :status)
            AND (:filterName = false OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :name, '%')))
            AND (:filterDateFrom = false OR a.createdAt >= :dateFrom)
            AND (:filterDateTo = false OR a.createdAt <= :dateTo)
            ORDER BY a.createdAt DESC
            """)
    Page<ExecutiveApplication> findWithFilters(
            @Param("filterStatus") boolean filterStatus,
            @Param("status") ApplicationStatus status,
            @Param("filterName") boolean filterName,
            @Param("name") String name,
            @Param("filterDateFrom") boolean filterDateFrom,
            @Param("dateFrom") Instant dateFrom,
            @Param("filterDateTo") boolean filterDateTo,
            @Param("dateTo") Instant dateTo,
            Pageable pageable);
}
