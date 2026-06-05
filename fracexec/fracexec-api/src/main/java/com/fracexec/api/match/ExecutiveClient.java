package com.fracexec.api.match;

import com.fracexec.api.executive.model.ExecutiveProfile;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "executive_clients")
public class ExecutiveClient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "executive_profile_id", nullable = false)
    private ExecutiveProfile executiveProfile;

    @Column(name = "cnae_2digit", nullable = false, length = 2)
    private String cnae2digit;

    @Column(name = "region_state", nullable = false, length = 2)
    private String regionState;

    @Column(name = "region_city", length = 100)
    private String regionCity;

    @Column(name = "company_size_range", length = 20)
    private String companySizeRange;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ExecutiveClient() {}

    public ExecutiveClient(ExecutiveProfile executiveProfile, String cnae2digit,
                           String regionState, String regionCity, String companySizeRange) {
        this.executiveProfile = executiveProfile;
        this.cnae2digit       = cnae2digit;
        this.regionState      = regionState;
        this.regionCity       = regionCity;
        this.companySizeRange = companySizeRange;
    }

    public UUID             getId()               { return id; }
    public ExecutiveProfile getExecutiveProfile() { return executiveProfile; }
    public String           getCnae2digit()       { return cnae2digit; }
    public String           getRegionState()      { return regionState; }
    public String           getRegionCity()       { return regionCity; }
    public String           getCompanySizeRange() { return companySizeRange; }
    public Instant          getCreatedAt()        { return createdAt; }
}
