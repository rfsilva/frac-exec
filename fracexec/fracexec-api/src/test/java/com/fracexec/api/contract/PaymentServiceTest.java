package com.fracexec.api.contract;

import com.fracexec.api.company.*;
import com.fracexec.api.contract.service.PaymentService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PaymentServiceTest {

    @Autowired PaymentService paymentService;
    @Autowired PaymentRepository paymentRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private UUID engagementId;

    @BeforeEach
    void setup() {
        User pme = new User("pme.ps@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company co = new Company("Empresa PS", "11.111.111/0001-11", "Tech",
            "E_11_50", "R_1M_5M", "Resp", "pme.ps@test.com", pme);
        co.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(co);

        Need need = new Need(co, "CFO", "3-4", null,
            LocalDate.now().plusMonths(1), "Desc PS.", "Res PS.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        User exec = new User("exec.ps@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio PS.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        Engagement eng = new Engagement(need, profile, new BigDecimal("8000.00"), 8, 3);
        eng.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng);
        engagementId = eng.getId();
    }

    @Test
    void createPaymentIntent_engagementAtivo_criaPaymentPending() {
        var response = paymentService.createPaymentIntent(engagementId);

        assertNotNull(response);
        assertNotNull(response.paymentId());
        assertEquals(new BigDecimal("8000.00"), response.grossAmount());
        assertNotNull(response.pixCode());

        var payment = paymentRepository.findById(response.paymentId()).orElseThrow();
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals(new BigDecimal("8000.00"), payment.getGrossAmount());
    }

    @Test
    void createPaymentIntent_engagementInativo_lancaBusinessRuleException() {
        Engagement eng = engagementRepository.findById(engagementId).orElseThrow();
        eng.setStatus(EngagementStatus.PAUSED);
        engagementRepository.save(eng);

        assertThrows(com.fracexec.api.shared.exception.BusinessRuleException.class,
            () -> paymentService.createPaymentIntent(engagementId));
    }

    @Test
    void createPaymentIntent_engagementNaoEncontrado_lancaResourceNotFoundException() {
        assertThrows(com.fracexec.api.shared.exception.ResourceNotFoundException.class,
            () -> paymentService.createPaymentIntent(UUID.randomUUID()));
    }

    @Test
    void processWebhookSucceeded_marcaComoPaid() {
        var resp = paymentService.createPaymentIntent(engagementId);
        var payment = paymentRepository.findById(resp.paymentId()).orElseThrow();
        String intentId = payment.getStripePaymentIntentId();

        paymentService.processWebhookSucceeded(intentId);

        var updated = paymentRepository.findById(resp.paymentId()).orElseThrow();
        assertEquals(PaymentStatus.PAID, updated.getStatus());
        assertNotNull(updated.getPaidAt());
    }

    @Test
    void processWebhookSucceeded_idempotente_naoDuplicaPaid() {
        var resp = paymentService.createPaymentIntent(engagementId);
        var payment = paymentRepository.findById(resp.paymentId()).orElseThrow();
        String intentId = payment.getStripePaymentIntentId();

        paymentService.processWebhookSucceeded(intentId);
        Instant firstPaidAt = paymentRepository.findById(resp.paymentId()).orElseThrow().getPaidAt();
        paymentService.processWebhookSucceeded(intentId); // segunda chamada — idempotente
        Instant secondPaidAt = paymentRepository.findById(resp.paymentId()).orElseThrow().getPaidAt();

        assertEquals(firstPaidAt, secondPaidAt);
    }

    @Test
    void processWebhookExpired_marcaComoExpired() {
        var resp = paymentService.createPaymentIntent(engagementId);
        var payment = paymentRepository.findById(resp.paymentId()).orElseThrow();
        String intentId = payment.getStripePaymentIntentId();

        paymentService.processWebhookExpired(intentId);

        var updated = paymentRepository.findById(resp.paymentId()).orElseThrow();
        assertEquals(PaymentStatus.EXPIRED, updated.getStatus());
    }

    @Test
    void listByEngagement_retornaPagamentos() {
        paymentService.createPaymentIntent(engagementId);
        var list = paymentService.listByEngagement(engagementId);
        assertEquals(1, list.size());
        assertEquals("PENDING", list.get(0).status());
    }
}
