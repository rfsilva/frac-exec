package com.fracexec.api.executive.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "executive_sectors")
public class ExecutiveSector {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", nullable = false)
    private ExecutiveProfile profile;

    @Column(name = "sector_name", nullable = false, length = 100)
    private String sectorName;

    protected ExecutiveSector() {}

    public ExecutiveSector(ExecutiveProfile profile, String sectorName) {
        this.profile = profile;
        this.sectorName = sectorName;
    }

    public UUID getId() { return id; }
    public String getSectorName() { return sectorName; }
}
