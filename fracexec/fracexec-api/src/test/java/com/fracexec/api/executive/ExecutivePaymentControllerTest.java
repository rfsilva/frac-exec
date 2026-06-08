package com.fracexec.api.executive;

import com.fracexec.api.company.*;
import com.fracexec.api.contract.*;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExecutivePaymentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PaymentRepository paymentRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private final String execEmail = "exec.pay@test.com";

    @BeforeEach
    void setup() {
        User pme = new User("pme.pay@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa PAY", "66.777.888/0001-99", "Tecnologia",
            "E_11_50", "R_1M_5M", "Resp", "pme.pay@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1), "Desafio financeiro.",
            "Resultado esperado.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        User exec = new User(execEmail, passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio PAY.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        Engagement eng = new Engagement(need, profile, new BigDecimal("10000.00"), 8, 6);
        eng.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng);

        Payment payment = new Payment(eng, new BigDecimal("10000.00"));
        payment.setStripePaymentIntentId("pi_test_123");
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(Instant.now());
        paymentRepository.save(payment);
    }

    @Test
    @WithMockUser(username = "exec.pay@test.com", roles = "EXECUTIVE")
    void list_retornaPagamentos() throws Exception {
        mockMvc.perform(get("/api/v1/executive/payments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].status").value("PAID"));
    }

    @Test
    @WithMockUser(username = "exec.pay@test.com", roles = "EXECUTIVE")
    void summary_retornaTotais() throws Exception {
        mockMvc.perform(get("/api/v1/executive/payments/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.monthTotal").exists())
            .andExpect(jsonPath("$.nextTransfer").exists());
    }

    @Test
    @WithMockUser(username = "exec.sem.perfil@test.com", roles = "EXECUTIVE")
    void list_semPerfil_retorna404() throws Exception {
        User sem = new User("exec.sem.perfil@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(sem);
        mockMvc.perform(get("/api/v1/executive/payments"))
            .andExpect(status().isNotFound());
    }
}
