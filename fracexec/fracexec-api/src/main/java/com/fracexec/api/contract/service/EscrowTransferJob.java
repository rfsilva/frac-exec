package com.fracexec.api.contract.service;

import com.fracexec.api.contract.Payment;
import com.fracexec.api.contract.PaymentRepository;
import com.fracexec.api.contract.PaymentStatus;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.util.BusinessDayCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class EscrowTransferJob {

    private static final Logger log = LoggerFactory.getLogger(EscrowTransferJob.class);

    private final PaymentRepository paymentRepository;
    private final EmailService      emailService;

    public EscrowTransferJob(PaymentRepository paymentRepository, EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.emailService      = emailService;
    }

    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void processEscrowTransfers() {
        // Pagamentos PAID cujo prazo de escrow (5 dias úteis) já passou
        Instant threshold = Instant.now();
        List<Payment> candidates = paymentRepository
            .findAllByStatusAndPaidAtBefore(PaymentStatus.PAID, threshold)
            .stream()
            .filter(p -> p.getPaidAt() != null &&
                BusinessDayCalculator.addBusinessDays(p.getPaidAt(), 5).isBefore(Instant.now()))
            .toList();

        for (Payment payment : candidates) {
            processTransfer(payment);
        }
        if (!candidates.isEmpty()) {
            log.info("EscrowTransferJob: processados {} repasses", candidates.size());
        }
    }

    public void processTransfer(Payment payment) {
        try {
            // MVP: simular repasse (sem Stripe Connect real)
            payment.setStatus(PaymentStatus.TRANSFERRED);
            payment.setTransferredAt(Instant.now());
            paymentRepository.save(payment);

            var engagement = payment.getEngagement();
            var execProfile = engagement.getExecutiveProfile();
            var company     = engagement.getNeed().getCompany();

            // E-mail ao executivo
            try {
                emailService.sendPaymentProcessed(
                    execProfile.getUser().getEmail(),
                    payment.getGrossAmount(), payment.getFeeAmount(),
                    payment.getNetAmount(), payment.getTransferredAt());
            } catch (Exception e) {
                log.warn("Falha ao enviar e-mail de repasse ao executivo: {}", e.getClass().getSimpleName());
            }

            // E-mail à PME
            try {
                emailService.sendPaymentReceipt(
                    company.getResponsibleEmail(),
                    payment.getGrossAmount(), payment.getPaidAt());
            } catch (Exception e) {
                log.warn("Falha ao enviar comprovante à PME: {}", e.getClass().getSimpleName());
            }

            log.info("Repasse [{}] processado — payment [{}]", payment.getNetAmount(), payment.getId());

        } catch (Exception e) {
            payment.setStatus(PaymentStatus.TRANSFER_FAILED);
            paymentRepository.save(payment);
            log.error("Falha no repasse do pagamento [{}]: {}", payment.getId(), e.getMessage());
        }
    }
}
