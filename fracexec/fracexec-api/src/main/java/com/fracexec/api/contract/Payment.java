package com.fracexec.api.contract;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "engagement_id", nullable = false)
    private Engagement engagement;

    @Column(name = "stripe_payment_intent_id", unique = true, length = 255)
    private String stripePaymentIntentId;

    @Column(name = "gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossAmount;

    @Column(name = "fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal feeAmount;

    @Column(name = "net_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "transferred_at")
    private Instant transferredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Payment() {}

    public Payment(Engagement engagement, BigDecimal grossAmount) {
        this.engagement  = engagement;
        this.grossAmount = grossAmount;
        this.feeAmount   = grossAmount.multiply(java.math.BigDecimal.valueOf(0.18))
            .setScale(2, java.math.RoundingMode.HALF_UP);
        this.netAmount   = grossAmount.subtract(this.feeAmount);
    }

    public UUID          getId()                       { return id; }
    public Engagement    getEngagement()               { return engagement; }
    public String        getStripePaymentIntentId()    { return stripePaymentIntentId; }
    public void          setStripePaymentIntentId(String s) { this.stripePaymentIntentId = s; }
    public BigDecimal    getGrossAmount()              { return grossAmount; }
    public BigDecimal    getFeeAmount()                { return feeAmount; }
    public BigDecimal    getNetAmount()                { return netAmount; }
    public PaymentStatus getStatus()                  { return status; }
    public void          setStatus(PaymentStatus s)   { this.status = s; }
    public Instant       getPaidAt()                  { return paidAt; }
    public void          setPaidAt(Instant t)         { this.paidAt = t; }
    public Instant       getTransferredAt()           { return transferredAt; }
    public void          setTransferredAt(Instant t)  { this.transferredAt = t; }
    public Instant       getCreatedAt()               { return createdAt; }
}
