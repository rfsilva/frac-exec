package com.fracexec.api.executive.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "executive_specialties")
public class ExecutiveSpecialty {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", nullable = false)
    private ExecutiveProfile profile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SpecialtyType specialty;

    protected ExecutiveSpecialty() {}

    public ExecutiveSpecialty(ExecutiveProfile profile, SpecialtyType specialty) {
        this.profile = profile;
        this.specialty = specialty;
    }

    public UUID getId() { return id; }
    public SpecialtyType getSpecialty() { return specialty; }
}
