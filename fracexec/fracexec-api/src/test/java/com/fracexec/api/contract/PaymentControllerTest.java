package com.fracexec.api.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.company.*;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PaymentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PaymentRepository paymentRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Engagement engagement;
    private String pmeEmail = "pme.pay@test.com";

    @BeforeEach
    void setup() {
        User pme = new User(pmeEmail, passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa Pay", "22.233.300/0100-35",
            "Tecnologia", "E_11_50", "R_1M_5M", "Pay Admin", pmeEmail, pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);
        Need need = new Need(company, "CFO", "3-4", "6 meses", LocalDate.now().plusMonths(1),
            "Desafio financeiro com mais de 50 caracteres para validar.",
            "Resultado esperado.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);
        User exec = new User("exec.pay@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio"); profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        engagement = new Engagement(need, profile, new BigDecimal("10000.00"), 8, 6);
        engagement.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(engagement);
    }

    @Test
    @WithMockUser(username = "pme.pay@test.com", roles = "PME")
    void criarPaymentIntent_retorna201ComClientSecret() throws Exception {
        mockMvc.perform(post("/api/v1/company/engagements/{id}/payments", engagement.getId()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.paymentId").exists())
            .andExpect(jsonPath("$.grossAmount").value(10000.00))
            .andExpect(jsonPath("$.feeAmount").exists())
            .andExpect(jsonPath("$.netAmount").exists());
    }

    @Test
    void webhookSucceeded_idempotente_retorna200SemDuplicar() throws Exception {
        // Criar pagamento manualmente com payment_intent_id
        Payment p = new Payment(engagement, new BigDecimal("10000.00"));
        p.setStripePaymentIntentId("pi_test_123");
        p.setStatus(PaymentStatus.PENDING);
        paymentRepository.save(p);

        String webhookBody = "{\"type\":\"payment_intent.succeeded\",\"data\":{\"object\":{\"id\":\"pi_test_123\"}}}";

        // Primeira chamada
        mockMvc.perform(post("/api/v1/webhooks/stripe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookBody))
            .andExpect(status().isOk());

        // Segunda chamada — idempotente
        mockMvc.perform(post("/api/v1/webhooks/stripe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(webhookBody))
            .andExpect(status().isOk());

        // Verificar apenas 1 registro PAID
        long paidCount = paymentRepository.findAllByEngagement(engagement).stream()
            .filter(pay -> pay.getStatus() == PaymentStatus.PAID).count();
        assert paidCount == 1;
    }
}
