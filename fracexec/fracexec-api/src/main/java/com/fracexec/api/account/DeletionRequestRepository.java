package com.fracexec.api.account;

import com.fracexec.api.shared.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DeletionRequestRepository extends JpaRepository<DeletionRequest, UUID> {
    boolean existsByUserAndStatusIn(User user, List<DeletionStatus> statuses);
    List<DeletionRequest> findAllByStatusAndProcessAfterBefore(DeletionStatus status, Instant now);
    long countByStatus(DeletionStatus status);
}
