package com.fracexec.api.contract;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "engagement_id", nullable = false, unique = true)
    private Engagement engagement;

    @Column(name = "storage_key", length = 500)
    private String storageKey;

    @Column(name = "signed_by_pme", nullable = false)
    private boolean signedByPme = false;

    @Column(name = "signed_by_executive", nullable = false)
    private boolean signedByExecutive = false;

    @Column(name = "monthly_value", precision = 12, scale = 2)
    private BigDecimal monthlyValue;

    @Column(name = "scope_days_per_month")
    private Integer scopeDaysPerMonth;

    @Column(name = "duration_months")
    private Integer durationMonths;

    @CreationTimestamp
    @Column(name = "generated_at", nullable = false, updatable = false)
    private Instant generatedAt = Instant.now();

    @Column(name = "fully_signed_at")
    private Instant fullySignedAt;

    protected Contract() {}

    public Contract(Engagement engagement, String storageKey,
                    BigDecimal monthlyValue, Integer scopeDaysPerMonth, Integer durationMonths) {
        this.engagement         = engagement;
        this.storageKey         = storageKey;
        this.monthlyValue       = monthlyValue;
        this.scopeDaysPerMonth  = scopeDaysPerMonth;
        this.durationMonths     = durationMonths;
    }

    public UUID       getId()                { return id; }
    public Engagement getEngagement()        { return engagement; }
    public String     getStorageKey()        { return storageKey; }
    public boolean    isSignedByPme()        { return signedByPme; }
    public void       setSignedByPme(boolean b)        { this.signedByPme = b; }
    public boolean    isSignedByExecutive()  { return signedByExecutive; }
    public void       setSignedByExecutive(boolean b)  { this.signedByExecutive = b; }
    public BigDecimal getMonthlyValue()      { return monthlyValue; }
    public Integer    getScopeDaysPerMonth() { return scopeDaysPerMonth; }
    public Integer    getDurationMonths()    { return durationMonths; }
    public Instant    getGeneratedAt()       { return generatedAt; }
    public Instant    getFullySignedAt()     { return fullySignedAt; }
    public void       setFullySignedAt(Instant t) { this.fullySignedAt = t; }
    public boolean    isFullySigned()        { return signedByPme && signedByExecutive; }
}
