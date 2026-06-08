package com.fracexec.api.match;

import com.fracexec.api.company.Need;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mediation_messages")
public class MediationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "need_id", nullable = false)
    private Need need;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false, length = 20)
    private SenderRole senderRole;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected MediationMessage() {}

    public MediationMessage(Need need, SenderRole senderRole, UUID senderId, String content) {
        this.need       = need;
        this.senderRole = senderRole;
        this.senderId   = senderId;
        this.content    = content;
    }

    public UUID        getId()         { return id; }
    public Need        getNeed()       { return need; }
    public SenderRole  getSenderRole() { return senderRole; }
    public UUID        getSenderId()   { return senderId; }
    public String      getContent()    { return content; }
    public Instant     getCreatedAt()  { return createdAt; }
}
