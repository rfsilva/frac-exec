package com.fracexec.api.company;

import com.fracexec.api.shared.auth.model.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "legal_name", nullable = false)
    private String legalName;

    @Column(nullable = false, unique = true, length = 18)
    private String cnpj;

    @Column(nullable = false, length = 100)
    private String sector;

    @Column(name = "employee_range", nullable = false, length = 20)
    private String employeeRange;

    @Column(name = "annual_revenue_range", nullable = false, length = 20)
    private String annualRevenueRange;

    @Column(name = "responsible_name", nullable = false)
    private String responsibleName;

    @Column(name = "responsible_email", nullable = false)
    private String responsibleEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CompanyStatus status = CompanyStatus.PENDING_ACTIVATION;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Company() {}

    public Company(String legalName, String cnpj, String sector,
                   String employeeRange, String annualRevenueRange,
                   String responsibleName, String responsibleEmail, User user) {
        this.legalName          = legalName;
        this.cnpj               = cnpj;
        this.sector             = sector;
        this.employeeRange      = employeeRange;
        this.annualRevenueRange = annualRevenueRange;
        this.responsibleName    = responsibleName;
        this.responsibleEmail   = responsibleEmail;
        this.user               = user;
        this.status             = CompanyStatus.PENDING_ACTIVATION;
    }

    public UUID          getId()                 { return id; }
    public String        getLegalName()          { return legalName; }
    public String        getCnpj()               { return cnpj; }
    public String        getSector()             { return sector; }
    public String        getEmployeeRange()      { return employeeRange; }
    public String        getAnnualRevenueRange() { return annualRevenueRange; }
    public String        getResponsibleName()    { return responsibleName; }
    public String        getResponsibleEmail()   { return responsibleEmail; }
    public CompanyStatus getStatus()             { return status; }
    public User          getUser()               { return user; }
    public Instant       getCreatedAt()          { return createdAt; }
    public void          setStatus(CompanyStatus status) { this.status = status; }
}
