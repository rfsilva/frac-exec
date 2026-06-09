package com.fracexec.api.contract;

import com.fracexec.api.company.*;
import com.fracexec.api.contract.service.EscrowTransferJob;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EscrowTransferJobTest {

    @Autowired EscrowTransferJob escrowTransferJob;
    @Autowired PaymentRepository paymentRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Engagement engagement;

    @BeforeEach
    void setup() {
        User pme = new User("pme.etj@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company co = new Company("Empresa ETJ", "44.444.444/0001-44", "Tech",
            "E_11_50", "R_1M_5M", "R", "pme.etj@test.com", pme);
        co.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(co);

        Need need = new Need(co, "CFO", "3-4", null,
            LocalDate.now().plusMonths(1), "Desc ETJ.", "Res ETJ.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        User exec = new User("exec.etj@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio ETJ.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        engagement = new Engagement(need, profile, new BigDecimal("10000.00"), 8, 3);
        engagement.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(engagement);
    }

    @Test
    void processTransfer_pagamentoPaid_marcaTransferred() {
        Payment payment = new Payment(engagement, new BigDecimal("10000.00"));
        payment.setStripePaymentIntentId("pi_etj_001");
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now().minusSeconds(3600 * 24 * 10)); // 10 dias atrás
        paymentRepository.save(payment);

        escrowTransferJob.processTransfer(payment);

        var updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.TRANSFERRED, updated.getStatus());
        assertNotNull(updated.getTransferredAt());
    }

    @Test
    void processEscrowTransfers_pagamentoAindaNoPrazo_naoTransfere() {
        Payment payment = new Payment(engagement, new BigDecimal("10000.00"));
        payment.setStripePaymentIntentId("pi_etj_002");
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now()); // pago agora — dentro do prazo de 5 dias úteis
        paymentRepository.save(payment);

        escrowTransferJob.processEscrowTransfers();

        var updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, updated.getStatus()); // ainda PAID
    }

    @Test
    void processEscrowTransfers_pagamentoVencido_transfere() {
        Payment payment = new Payment(engagement, new BigDecimal("10000.00"));
        payment.setStripePaymentIntentId("pi_etj_004");
        payment.setStatus(PaymentStatus.PAID);
        // Pago há 10 dias — prazo de 5 dias úteis já passou
        payment.setPaidAt(Instant.now().minusSeconds(3600L * 24 * 10));
        paymentRepository.save(payment);

        escrowTransferJob.processEscrowTransfers();

        var updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.TRANSFERRED, updated.getStatus());
    }

    @Test
    void processEscrowTransfers_semPagamentos_naoFazNada() {
        // Nenhum pagamento PAID — não deve lançar exceção
        assertDoesNotThrow(() -> escrowTransferJob.processEscrowTransfers());
    }
}
