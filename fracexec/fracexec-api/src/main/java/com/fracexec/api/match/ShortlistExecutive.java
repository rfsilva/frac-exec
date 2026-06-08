package com.fracexec.api.match;

import com.fracexec.api.executive.model.ExecutiveProfile;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shortlist_executives")
public class ShortlistExecutive {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shortlist_id", nullable = false)
    private Shortlist shortlist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "executive_profile_id", nullable = false)
    private ExecutiveProfile executiveProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "conflict_status", nullable = false, length = 20)
    private ConflictStatus conflictStatus = ConflictStatus.CLEAR;

    @Column(name = "conflict_decided_by")
    private UUID conflictDecidedBy;

    @Column(name = "conflict_decided_at")
    private Instant conflictDecidedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ShortlistExecutive() {}

    public ShortlistExecutive(Shortlist shortlist, ExecutiveProfile executiveProfile,
                              ConflictStatus conflictStatus) {
        this.shortlist        = shortlist;
        this.executiveProfile = executiveProfile;
        this.conflictStatus   = conflictStatus;
    }

    public UUID             getId()                { return id; }
    public Shortlist        getShortlist()         { return shortlist; }
    public ExecutiveProfile getExecutiveProfile()  { return executiveProfile; }
    public ConflictStatus   getConflictStatus()    { return conflictStatus; }
    public void             setConflictStatus(ConflictStatus s)    { this.conflictStatus = s; }
    public UUID             getConflictDecidedBy() { return conflictDecidedBy; }
    public void             setConflictDecidedBy(UUID id)          { this.conflictDecidedBy = id; }
    public Instant          getConflictDecidedAt() { return conflictDecidedAt; }
    public void             setConflictDecidedAt(Instant t)        { this.conflictDecidedAt = t; }
}
