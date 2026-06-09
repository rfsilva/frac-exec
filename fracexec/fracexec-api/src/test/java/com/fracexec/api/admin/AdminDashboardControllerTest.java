package com.fracexec.api.admin;

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
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminDashboardControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired ContractRepository contractRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PaymentRepository paymentRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        if (userRepository.findByEmail("admin@fracexec.com").isEmpty()) {
            userRepository.save(new User("admin@fracexec.com", passwordEncoder.encode("p"), Role.ADMIN));
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void dashboard_bancoBD_retornaEstrutura() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.candidatures.total").exists())
            .andExpect(jsonPath("$.pool.active").exists())
            .andExpect(jsonPath("$.needs.active").exists())
            .andExpect(jsonPath("$.contracts.active").exists())
            .andExpect(jsonPath("$.paymentPipeline.toReceive").exists())
            .andExpect(jsonPath("$.paymentPipeline.inEscrow").exists())
            .andExpect(jsonPath("$.paymentPipeline.transferred").exists())
            .andExpect(jsonPath("$.lgpdPendingCount").value(0));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void dashboard_comExecutivoAtivo_contaPool() throws Exception {
        User exec = new User("exec.adm.dash@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio admin dash.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.pool.active").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void dashboard_comNeedAtiva_contaNecessidades() throws Exception {
        User pme = new User("pme.adm.dash@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa ADM", "77.888.999/0001-00", "Saúde",
            "E_11_50", "R_1M_5M", "Resp", "pme.adm.dash@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1), "Desafio.",
            "Resultado.", null, NeedStatus.UNDER_ANALYSIS);
        needRepository.save(need);

        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.needs.active").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    @WithMockUser(roles = "PME")
    void dashboard_rolePME_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isForbidden());
    }
}
