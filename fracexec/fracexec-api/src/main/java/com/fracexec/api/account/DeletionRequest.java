package com.fracexec.api.account;

import com.fracexec.api.shared.auth.model.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deletion_requests")
public class DeletionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeletionStatus status = DeletionStatus.PENDING;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "process_after", nullable = false)
    private Instant processAfter;

    @Column(name = "processed_at")
    private Instant processedAt;

    protected DeletionRequest() {}

    public DeletionRequest(User user, Instant processAfter, DeletionStatus status) {
        this.user         = user;
        this.processAfter = processAfter;
        this.status       = status;
    }

    public UUID           getId()           { return id; }
    public User           getUser()         { return user; }
    public DeletionStatus getStatus()       { return status; }
    public void           setStatus(DeletionStatus s) { this.status = s; }
    public Instant        getRequestedAt()  { return requestedAt; }
    public Instant        getProcessAfter() { return processAfter; }
    public Instant        getProcessedAt()  { return processedAt; }
    public void           setProcessedAt(Instant t) { this.processedAt = t; }
}
