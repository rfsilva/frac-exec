package com.fracexec.api.executive;

import com.fracexec.api.company.*;
import com.fracexec.api.contract.Engagement;
import com.fracexec.api.contract.EngagementRepository;
import com.fracexec.api.contract.EngagementStatus;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExecutiveEngagementsControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private User execUser;
    private static final String URL = "/api/v1/executive/engagements";

    @BeforeEach
    void setup() {
        execUser = new User("eng.exec@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(execUser);

        ExecutiveProfile profile = new ExecutiveProfile(execUser);
        profile.setBio("Bio teste engajamentos.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        User pme = new User("pme.engtest@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa Teste Eng", "11.222.333/0001-44", "Tecnologia",
            "E_11_50", "R_1M_5M", "Resp", "pme.engtest@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1), "Desafio.", "Resultado.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        Engagement eng = new Engagement(need, profile, new BigDecimal("15000.00"), 10, 6);
        eng.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng);
    }

    private RequestPostProcessor auth() {
        return SecurityMockMvcRequestPostProcessors.authentication(
            new UsernamePasswordAuthenticationToken(execUser, null, execUser.getAuthorities()));
    }

    @Test
    void list_semAuth_retorna401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    @Test
    void list_comAuth_retornaEngajamentos() throws Exception {
        mockMvc.perform(get(URL).with(auth()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].status").value("ACTIVE"))
            .andExpect(jsonPath("$[0].companyName").value("Empresa Teste Eng"));
    }

    @Test
    void list_filtroStatus_retornaFiltrado() throws Exception {
        mockMvc.perform(get(URL).param("status", "ACTIVE").with(auth()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void list_filtroStatusInvalido_retorna400() throws Exception {
        mockMvc.perform(get(URL).param("status", "STATUS_INVALIDO").with(auth()))
            .andExpect(status().isBadRequest());
    }

    @Test
    void list_filtroStatusSemResultados_retornaListaVazia() throws Exception {
        mockMvc.perform(get(URL).param("status", "COMPLETED").with(auth()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void list_perfilNaoExistente_retorna404() throws Exception {
        // Usuário EXECUTIVE sem perfil criado
        User semPerfil = new User("sem.perfil@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(semPerfil);
        var authSemPerfil = SecurityMockMvcRequestPostProcessors.authentication(
            new UsernamePasswordAuthenticationToken(semPerfil, null, semPerfil.getAuthorities()));
        mockMvc.perform(get(URL).with(authSemPerfil))
            .andExpect(status().isNotFound());
    }
}
