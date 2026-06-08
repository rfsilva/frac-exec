package com.fracexec.api.company;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "needs")
public class Need {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "clevel_type", nullable = false, length = 20)
    private String cLevelType;

    @Column(name = "scope_days_per_month", nullable = false, length = 10)
    private String scopeDaysPerMonth;

    @Column(name = "estimated_duration", length = 50)
    private String estimatedDuration;

    @Column(name = "desired_start")
    private LocalDate desiredStart;

    @Column(name = "challenge_description", nullable = false, columnDefinition = "TEXT")
    private String challengeDescription;

    @Column(name = "expected_result", nullable = false, columnDefinition = "TEXT")
    private String expectedResult;

    @Column(name = "confidential_context", columnDefinition = "TEXT")
    private String confidentialContext;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NeedStatus status = NeedStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Need() {}

    @SuppressWarnings("java:S107") // entidade JPA — todos os campos são obrigatórios na criação
    public Need(Company company, String cLevelType, String scopeDaysPerMonth,
                String estimatedDuration, LocalDate desiredStart,
                String challengeDescription, String expectedResult,
                String confidentialContext, NeedStatus status) {
        this.company             = company;
        this.cLevelType          = cLevelType;
        this.scopeDaysPerMonth   = scopeDaysPerMonth;
        this.estimatedDuration   = estimatedDuration;
        this.desiredStart        = desiredStart;
        this.challengeDescription = challengeDescription;
        this.expectedResult      = expectedResult;
        this.confidentialContext  = confidentialContext;
        this.status              = status;
    }

    public UUID       getId()                  { return id; }
    public Company    getCompany()             { return company; }
    public String     getCLevelType()          { return cLevelType; }
    public String     getScopeDaysPerMonth()   { return scopeDaysPerMonth; }
    public String     getEstimatedDuration()   { return estimatedDuration; }
    public LocalDate  getDesiredStart()        { return desiredStart; }
    public String     getChallengeDescription(){ return challengeDescription; }
    public String     getExpectedResult()      { return expectedResult; }
    public String     getConfidentialContext() { return confidentialContext; }
    public NeedStatus getStatus()              { return status; }
    public Instant    getCreatedAt()           { return createdAt; }
    public Instant    getUpdatedAt()           { return updatedAt; }
    public void       setStatus(NeedStatus s)  { this.status = s; }
}
