package com.fracexec.api.match;

import com.fracexec.api.company.Need;
import com.fracexec.api.executive.model.ExecutiveProfile;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "executive_opportunities")
public class ExecutiveOpportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shortlist_executive_id", nullable = false)
    private ShortlistExecutive shortlistExecutive;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "executive_profile_id", nullable = false)
    private ExecutiveProfile executiveProfile;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "need_id", nullable = false)
    private Need need;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OpportunityStatus status = OpportunityStatus.AVAILABLE;

    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason;

    @Column(name = "interested_at")
    private Instant interestedAt;

    @Column(name = "declined_at")
    private Instant declinedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "retracted_at")
    private Instant retractedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ExecutiveOpportunity() {}

    public ExecutiveOpportunity(ShortlistExecutive shortlistExecutive,
                                ExecutiveProfile executiveProfile,
                                Need need, Instant expiresAt) {
        this.shortlistExecutive = shortlistExecutive;
        this.executiveProfile   = executiveProfile;
        this.need               = need;
        this.expiresAt          = expiresAt;
    }

    public UUID                getId()                { return id; }
    public ExecutiveProfile    getExecutiveProfile()  { return executiveProfile; }
    public Need                getNeed()              { return need; }
    public OpportunityStatus   getStatus()            { return status; }
    public void                setStatus(OpportunityStatus s)     { this.status = s; }
    public String              getDeclineReason()     { return declineReason; }
    public void                setDeclineReason(String r)         { this.declineReason = r; }
    public Instant             getInterestedAt()      { return interestedAt; }
    public void                setInterestedAt(Instant t)         { this.interestedAt = t; }
    public Instant             getDeclinedAt()        { return declinedAt; }
    public void                setDeclinedAt(Instant t)           { this.declinedAt = t; }
    public Instant             getExpiresAt()         { return expiresAt; }
    public Instant             getRetractedAt()       { return retractedAt; }
    public void                setRetractedAt(Instant t)          { this.retractedAt = t; }
    public Instant             getCreatedAt()         { return createdAt; }

    public boolean canRetract() {
        return status == OpportunityStatus.INTERESTED
            && interestedAt != null
            && Instant.now().isBefore(interestedAt.plusSeconds(86400));
    }
}
