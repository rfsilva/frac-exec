package com.fracexec.api.executive.model;

import com.fracexec.api.shared.auth.model.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "executive_applications")
public class ExecutiveApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(columnDefinition = "TEXT")
    private String motivation;

    @Column(name = "lgpd_consent", nullable = false)
    private boolean lgpdConsent;

    @Column(name = "lgpd_consent_at")
    private Instant lgpdConsentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "can_reapply_after")
    private Instant canReapplyAfter;

    // V4 fields — Story 2.3
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "support_document_key")
    private String supportDocumentKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("positionOrder ASC")
    private List<ApplicationPosition> positions = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApplicationReference> references = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ExecutiveApplication() {}

    public ExecutiveApplication(String fullName, String email, String linkedinUrl,
                                String motivation, boolean lgpdConsent, Instant lgpdConsentAt) {
        this.fullName = fullName;
        this.email = email;
        this.linkedinUrl = linkedinUrl;
        this.motivation = motivation;
        this.lgpdConsent = lgpdConsent;
        this.lgpdConsentAt = lgpdConsentAt;
    }

    public void addPosition(ApplicationPosition pos) { pos.setApplication(this); this.positions.add(pos); }
    public void addReference(ApplicationReference ref) { ref.setApplication(this); this.references.add(ref); }

    public UUID getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getLinkedinUrl() { return linkedinUrl; }
    public String getMotivation() { return motivation; }
    public boolean isLgpdConsent() { return lgpdConsent; }
    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String reason) { this.rejectionReason = reason; }
    public Instant getCanReapplyAfter() { return canReapplyAfter; }
    public void setCanReapplyAfter(Instant t) { this.canReapplyAfter = t; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String notes) { this.adminNotes = notes; }
    public String getSupportDocumentKey() { return supportDocumentKey; }
    public void setSupportDocumentKey(String key) { this.supportDocumentKey = key; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public List<ApplicationPosition> getPositions() { return positions; }
    public List<ApplicationReference> getReferences() { return references; }
    public Instant getCreatedAt() { return createdAt; }
}
