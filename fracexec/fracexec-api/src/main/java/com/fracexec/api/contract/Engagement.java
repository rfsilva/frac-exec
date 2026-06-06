package com.fracexec.api.contract;

import com.fracexec.api.company.Need;
import com.fracexec.api.executive.model.ExecutiveProfile;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "engagements")
public class Engagement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "need_id", nullable = false)
    private Need need;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "executive_profile_id", nullable = false)
    private ExecutiveProfile executiveProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EngagementStatus status = EngagementStatus.PENDING;

    @Column(name = "monthly_value", precision = 12, scale = 2)
    private BigDecimal monthlyValue;

    @Column(name = "scope_days_per_month")
    private Integer scopeDaysPerMonth;

    @Column(name = "duration_months")
    private Integer durationMonths;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "status_reason", columnDefinition = "TEXT")
    private String statusReason;

    @Column(name = "status_updated_at")
    private Instant statusUpdatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Engagement() {}

    public Engagement(Need need, ExecutiveProfile executiveProfile,
                      BigDecimal monthlyValue, Integer scopeDaysPerMonth, Integer durationMonths) {
        this.need               = need;
        this.executiveProfile   = executiveProfile;
        this.monthlyValue       = monthlyValue;
        this.scopeDaysPerMonth  = scopeDaysPerMonth;
        this.durationMonths     = durationMonths;
    }

    public UUID             getId()               { return id; }
    public Need             getNeed()             { return need; }
    public ExecutiveProfile getExecutiveProfile() { return executiveProfile; }
    public EngagementStatus getStatus()           { return status; }
    public void             setStatus(EngagementStatus s) { this.status = s; }
    public BigDecimal       getMonthlyValue()     { return monthlyValue; }
    public Integer          getScopeDaysPerMonth(){ return scopeDaysPerMonth; }
    public Integer          getDurationMonths()   { return durationMonths; }
    public Instant          getStartedAt()        { return startedAt; }
    public void             setStartedAt(Instant t) { this.startedAt = t; }
    public Instant          getCreatedAt()        { return createdAt; }
    public String           getStatusReason()     { return statusReason; }
    public void             setStatusReason(String r) { this.statusReason = r; }
    public Instant          getStatusUpdatedAt()  { return statusUpdatedAt; }
    public void             setStatusUpdatedAt(Instant t) { this.statusUpdatedAt = t; }
}
