package com.fracexec.api.match;

import com.fracexec.api.company.Need;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shortlists")
public class Shortlist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "need_id", nullable = false, unique = true)
    private Need need;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShortlistStatus status = ShortlistStatus.DRAFT;

    @OneToMany(mappedBy = "shortlist", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShortlistExecutive> executives = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Shortlist() {}

    public Shortlist(Need need) { this.need = need; }

    public UUID                    getId()         { return id; }
    public Need                    getNeed()       { return need; }
    public ShortlistStatus         getStatus()     { return status; }
    public void                    setStatus(ShortlistStatus s) { this.status = s; }
    public List<ShortlistExecutive> getExecutives() { return executives; }
    public Instant                 getCreatedAt()  { return createdAt; }
}
