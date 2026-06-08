package com.fracexec.api.contract.service;

import com.fracexec.api.contract.*;
import com.fracexec.api.contract.dto.PaymentIntentResponse;
import com.fracexec.api.contract.dto.PaymentResponse;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.util.BusinessDayCalculator;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final long PIX_EXPIRY_SECONDS = 3600L;
    private static final DateTimeFormatter MONTH_FMT =
        DateTimeFormatter.ofPattern("yyyy-MM").withZone(ZoneId.of("America/Sao_Paulo"));

    private final PaymentRepository    paymentRepository;
    private final EngagementRepository engagementRepository;

    @Value("${fracexec.stripe.api-key:}")
    private String stripeApiKey;

    public PaymentService(PaymentRepository paymentRepository,
                          EngagementRepository engagementRepository) {
        this.paymentRepository    = paymentRepository;
        this.engagementRepository = engagementRepository;
    }

    public PaymentIntentResponse createPaymentIntent(UUID engagementId) {
        var engagement = engagementRepository.findById(engagementId)
            .orElseThrow(() -> new ResourceNotFoundException("Engajamento não encontrado."));
        if (engagement.getStatus() != EngagementStatus.ACTIVE) {
            throw new BusinessRuleException("Pagamentos só podem ser criados para engajamentos ACTIVE.");
        }

        BigDecimal grossAmount = engagement.getMonthlyValue();
        var payment = new Payment(engagement, grossAmount);

        String intentId = null;
        String clientSecret = null;
        String pixCode = "mock-pix-" + UUID.randomUUID().toString().substring(0, 8);

        if (stripeApiKey != null && !stripeApiKey.isBlank()) {
            try {
                Stripe.apiKey = stripeApiKey;
                var params = PaymentIntentCreateParams.builder()
                    .setAmount(grossAmount.multiply(BigDecimal.valueOf(100)).longValue())
                    .setCurrency("brl")
                    .addPaymentMethodType("pix")
                    .putMetadata("engagement_id", engagementId.toString())
                    .build();
                var intent = PaymentIntent.create(params);
                intentId   = intent.getId();
                clientSecret = intent.getClientSecret();
            } catch (Exception e) {
                log.warn("Stripe indisponível — usando mock PIX: {}", e.getMessage());
            }
        }

        payment.setStripePaymentIntentId(intentId != null ? intentId : "mock-" + UUID.randomUUID());
        paymentRepository.save(payment);

        Instant expiresAt = Instant.now().plusSeconds(PIX_EXPIRY_SECONDS);
        return new PaymentIntentResponse(
            payment.getId(), clientSecret != null ? clientSecret : "mock-secret",
            pixCode, grossAmount, payment.getFeeAmount(), payment.getNetAmount(), expiresAt
        );
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listByEngagement(UUID engagementId) {
        var engagement = engagementRepository.findById(engagementId)
            .orElseThrow(() -> new ResourceNotFoundException("Engajamento não encontrado."));
        return paymentRepository.findAllByEngagement(engagement)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listByEngagements(List<Engagement> engagements) {
        return paymentRepository.findAllByEngagementIn(engagements)
            .stream().map(this::toResponse).toList();
    }

    public void processWebhookSucceeded(String paymentIntentId) {
        if (paymentRepository.existsByStripePaymentIntentId(paymentIntentId)) {
            var existing = paymentRepository.findByStripePaymentIntentId(paymentIntentId).orElseThrow();
            if (existing.getStatus() == PaymentStatus.PAID) {
                log.info("Webhook idempotente — payment_intent {} já processado", paymentIntentId);
                return;
            }
            existing.setStatus(PaymentStatus.PAID);
            existing.setPaidAt(Instant.now());
            paymentRepository.save(existing);
            log.info("Pagamento [{}] marcado como PAID via webhook", existing.getId());
        }
    }

    public void processWebhookExpired(String paymentIntentId) {
        paymentRepository.findByStripePaymentIntentId(paymentIntentId).ifPresent(p -> {
            if (p.getStatus() == PaymentStatus.PENDING) {
                p.setStatus(PaymentStatus.EXPIRED);
                paymentRepository.save(p);
                log.info("Pagamento [{}] expirado via webhook", p.getId());
            }
        });
    }

    public PaymentResponse toResponse(Payment p) {
        Instant est = p.getPaidAt() != null
            ? BusinessDayCalculator.addBusinessDays(p.getPaidAt(), 5) : null;
        return new PaymentResponse(
            p.getId(), p.getEngagement().getId(),
            p.getPaidAt() != null ? MONTH_FMT.format(p.getPaidAt()) : null,
            p.getGrossAmount(), p.getFeeAmount(), p.getNetAmount(),
            p.getStatus().name(), p.getPaidAt(), est, p.getTransferredAt()
        );
    }
}
