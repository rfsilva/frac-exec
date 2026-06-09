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
class ExecutiveDashboardControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private final String execEmail = "exec.dash@test.com";

    @BeforeEach
    void setup() {
        User exec = new User(execEmail, passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio dashboard.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);
    }

    @Test
    @WithMockUser(username = "exec.dash@test.com", roles = "EXECUTIVE")
    void dashboard_semEngajamentos_retornaZeros() throws Exception {
        mockMvc.perform(get("/api/v1/executive/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.activeEngagementsCount").value(0))
            .andExpect(jsonPath("$.pendingOpportunitiesCount").value(0))
            .andExpect(jsonPath("$.committedDaysMonth").value(0));
    }

    @Test
    @WithMockUser(username = "exec.dash@test.com", roles = "EXECUTIVE")
    void dashboard_comEngajamentoAtivo_retornaContagens() throws Exception {
        User pme = new User("pme.dash@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa Dash", "44.555.666/0001-77", "Saúde",
            "E_11_50", "R_1M_5M", "Resp", "pme.dash@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1), "Desafio financeiro.",
            "Resultado esperado.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        var exec = userRepository.findByEmail(execEmail).orElseThrow();
        var profile = profileRepository.findByUser(exec).orElseThrow();

        Engagement eng = new Engagement(need, profile, new BigDecimal("12000.00"), 8, 6);
        eng.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng);

        mockMvc.perform(get("/api/v1/executive/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.activeEngagementsCount").value(1))
            .andExpect(jsonPath("$.committedDaysMonth").value(8));
    }

    @Test
    @WithMockUser(username = "sem.perfil@test.com", roles = "EXECUTIVE")
    void dashboard_semPerfil_retorna404() throws Exception {
        User semPerfil = new User("sem.perfil@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(semPerfil);

        mockMvc.perform(get("/api/v1/executive/dashboard"))
            .andExpect(status().isNotFound());
    }
}
