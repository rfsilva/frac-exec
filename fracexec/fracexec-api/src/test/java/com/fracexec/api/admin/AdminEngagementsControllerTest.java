package com.fracexec.api.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminEngagementsControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String engagementId;

    @BeforeEach
    void setup() {
        User pme = new User("pme.eng@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa ENG", "55.666.777/0001-88", "Tecnologia",
            "E_11_50", "R_1M_5M", "Resp", "pme.eng@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1),
            "Desafio financeiro.",
            "Resultado esperado.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        User exec = new User("exec.eng@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio ENG.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        Engagement eng = new Engagement(need, profile, new BigDecimal("10000.00"), 8, 6);
        eng.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng);
        engagementId = eng.getId().toString();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_retornaEngajamentos() throws Exception {
        mockMvc.perform(get("/api/v1/admin/engagements"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$[0].companyName").value("Empresa ENG"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateStatus_paused_persisteStatus() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/engagements/{id}/status", engagementId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "PAUSED", "reason", "Férias do executivo"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAUSED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateStatus_statusInvalido_retorna400() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/engagements/{id}/status", engagementId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "INVALIDO"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateStatus_naoEncontrado_retorna404() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/engagements/{id}/status", java.util.UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))))
            .andExpect(status().isNotFound());
    }
}
