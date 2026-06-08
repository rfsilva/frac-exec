package com.fracexec.api.executive.model;

import com.fracexec.api.shared.auth.model.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "executive_profiles")
public class ExecutiveProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "photo_key")
    private String photoKey;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "experience_summary", columnDefinition = "TEXT")
    private String experienceSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "company_visibility", columnDefinition = "jsonb")
    private Map<String, Boolean> companyVisibility = new HashMap<>();

    @Column(name = "availability_days_per_month", nullable = false)
    private int availabilityDaysPerMonth = 20;

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_status", nullable = false, length = 20)
    private ProfileStatus profileStatus = ProfileStatus.INACTIVE;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExecutiveSpecialty> specialties = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExecutiveSector> sectors = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ExecutiveProfile() {}

    public ExecutiveProfile(User user) {
        this.user = user;
    }

    public boolean isComplete() {
        return bio != null && !bio.isBlank() && !specialties.isEmpty();
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getPhotoKey() { return photoKey; }
    public void setPhotoKey(String key) { this.photoKey = key; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getExperienceSummary() { return experienceSummary; }
    public void setExperienceSummary(String s) { this.experienceSummary = s; }
    public Map<String, Boolean> getCompanyVisibility() { return companyVisibility; }
    public void setCompanyVisibility(Map<String, Boolean> v) { this.companyVisibility = v; }
    public int getAvailabilityDaysPerMonth() { return availabilityDaysPerMonth; }
    public void setAvailabilityDaysPerMonth(int d) { this.availabilityDaysPerMonth = d; }
    public ProfileStatus getProfileStatus() { return profileStatus; }
    public void setProfileStatus(ProfileStatus s) { this.profileStatus = s; }
    public List<ExecutiveSpecialty> getSpecialties() { return specialties; }
    public List<ExecutiveSector> getSectors() { return sectors; }
    public Instant getCreatedAt() { return createdAt; }
}
