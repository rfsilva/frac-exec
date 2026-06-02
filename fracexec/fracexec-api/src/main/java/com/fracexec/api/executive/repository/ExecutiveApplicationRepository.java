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

    // B2: ORDER BY createdAt DESC garante o REJECTED mais recente para o cooldown check
    @Query("SELECT a FROM ExecutiveApplication a WHERE a.email = :email AND a.status = :status ORDER BY a.createdAt DESC")
    Optional<ExecutiveApplication> findLatestByEmailAndStatus(
            @Param("email") String email,
            @Param("status") ApplicationStatus status);

    @Query("""
            SELECT a FROM ExecutiveApplication a
            WHERE (:status IS NULL OR a.status = :status)
            AND (:name IS NULL OR LOWER(a.fullName) LIKE LOWER(CONCAT('%', :name, '%')))
            AND (:dateFrom IS NULL OR a.createdAt >= :dateFrom)
            AND (:dateTo IS NULL OR a.createdAt <= :dateTo)
            ORDER BY a.createdAt DESC
            """)
    Page<ExecutiveApplication> findWithFilters(
            @Param("status") ApplicationStatus status,
            @Param("name") String name,
            @Param("dateFrom") Instant dateFrom,
            @Param("dateTo") Instant dateTo,
            Pageable pageable);
}
