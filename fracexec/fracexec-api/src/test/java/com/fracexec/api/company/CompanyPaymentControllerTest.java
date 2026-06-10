package com.fracexec.api.company;

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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CompanyPaymentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private User pmeUser;
    private UUID engagementId;
    private static final String PAYMENTS_URL = "/api/v1/company/payments";

    @BeforeEach
    void setup() {
        pmeUser = new User("pme.pay@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pmeUser);
        Company company = new Company("Empresa PAY", "33.444.555/0001-66", "Tecnologia",
            "E_11_50", "R_1M_5M", "Resp", "pme.pay@test.com", pmeUser);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1), "Desafio pay.", "Resultado.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        User exec = new User("exec.pay@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio pay.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        Engagement eng = new Engagement(need, profile, new BigDecimal("12000.00"), 10, 6);
        eng.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng);
        engagementId = eng.getId();
    }

    private RequestPostProcessor auth() {
        return SecurityMockMvcRequestPostProcessors.authentication(
            new UsernamePasswordAuthenticationToken(pmeUser, null, pmeUser.getAuthorities()));
    }

    @Test
    void listPayments_semAuth_retorna401() throws Exception {
        mockMvc.perform(get(PAYMENTS_URL)).andExpect(status().isUnauthorized());
    }

    @Test
    void listPayments_comAuth_retornaLista() throws Exception {
        mockMvc.perform(get(PAYMENTS_URL).with(auth()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void listPayments_empresaNaoEncontrada_retorna404() throws Exception {
        // Usuário PME sem empresa associada
        User semEmpresa = new User("sem.empresa@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(semEmpresa);
        RequestPostProcessor authSem = SecurityMockMvcRequestPostProcessors.authentication(
            new UsernamePasswordAuthenticationToken(semEmpresa, null, semEmpresa.getAuthorities()));
        mockMvc.perform(get(PAYMENTS_URL).with(authSem))
            .andExpect(status().isNotFound());
    }

    @Test
    void createPayment_engagementNaoEncontrado_retorna404() throws Exception {
        mockMvc.perform(post("/api/v1/company/engagements/{id}/payments", UUID.randomUUID())
                .with(auth()))
            .andExpect(status().isNotFound());
    }

    @Test
    void createPayment_engagementDeOutraEmpresa_retorna403() throws Exception {
        // Cria outro PME e empresa
        User outroPme = new User("outro.pme@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(outroPme);
        Company outraEmpresa = new Company("Outra Empresa", "77.888.999/0001-11", "Saúde",
            "E_11_50", "R_1M_5M", "Resp", "outro.pme@test.com", outroPme);
        outraEmpresa.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(outraEmpresa);

        RequestPostProcessor authOutro = SecurityMockMvcRequestPostProcessors.authentication(
            new UsernamePasswordAuthenticationToken(outroPme, null, outroPme.getAuthorities()));
        // Tenta criar payment no engagement que pertence a pmeUser
        mockMvc.perform(post("/api/v1/company/engagements/{id}/payments", engagementId)
                .with(authOutro))
            .andExpect(status().isForbidden());
    }
}
