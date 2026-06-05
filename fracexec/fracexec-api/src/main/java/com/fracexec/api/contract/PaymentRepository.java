package com.fracexec.api.contract;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    boolean             existsByStripePaymentIntentId(String id);
    Optional<Payment>   findByStripePaymentIntentId(String id);
    List<Payment>       findAllByEngagement(Engagement engagement);
    List<Payment>       findAllByEngagementIn(List<Engagement> engagements);
    List<Payment>       findAllByStatusAndPaidAtBefore(PaymentStatus status, Instant threshold);
}
