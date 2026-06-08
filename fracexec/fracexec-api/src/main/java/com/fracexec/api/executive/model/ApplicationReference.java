package com.fracexec.api.executive.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "application_references")
public class ApplicationReference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private ExecutiveApplication application;

    @Column(name = "ref_name", nullable = false)
    private String refName;

    @Column(name = "ref_role", nullable = false, length = 100)
    private String refRole;

    @Column(name = "ref_contact", nullable = false)
    private String refContact;

    protected ApplicationReference() {}

    public ApplicationReference(String refName, String refRole, String refContact) {
        this.refName = refName;
        this.refRole = refRole;
        this.refContact = refContact;
    }

    public void setApplication(ExecutiveApplication application) { this.application = application; }

    public UUID getId() { return id; }
    public String getRefName() { return refName; }
    public String getRefRole() { return refRole; }
    public String getRefContact() { return refContact; }
}
