package com.fracexec.api.executive.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "application_positions")
public class ApplicationPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private ExecutiveApplication application;

    @Column(name = "role_title", nullable = false, length = 100)
    private String roleTitle;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "team_size", length = 50)
    private String teamSize;

    @Column(name = "revenue_managed", length = 100)
    private String revenueManaged;

    @Column(name = "position_order", nullable = false)
    private int positionOrder = 0;

    protected ApplicationPosition() {}

    public ApplicationPosition(String roleTitle, String companyName, LocalDate periodStart,
                               LocalDate periodEnd, String teamSize, String revenueManaged,
                               int positionOrder) {
        this.roleTitle = roleTitle;
        this.companyName = companyName;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.teamSize = teamSize;
        this.revenueManaged = revenueManaged;
        this.positionOrder = positionOrder;
    }

    public void setApplication(ExecutiveApplication application) { this.application = application; }

    public UUID getId() { return id; }
    public String getRoleTitle() { return roleTitle; }
    public String getCompanyName() { return companyName; }
    public LocalDate getPeriodStart() { return periodStart; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public String getTeamSize() { return teamSize; }
    public String getRevenueManaged() { return revenueManaged; }
    public int getPositionOrder() { return positionOrder; }
}
