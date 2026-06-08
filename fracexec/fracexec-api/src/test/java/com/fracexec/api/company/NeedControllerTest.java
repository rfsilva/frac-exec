package com.fracexec.api.company;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.company.dto.NeedRequest;
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

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NeedControllerTest {

    @Autowired MockMvc        mockMvc;
    @Autowired ObjectMapper   objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String NEEDS_URL     = "/api/v1/company/needs";
    private static final String DRAFT_URL     = "/api/v1/company/needs/draft";
    private static final String DASHBOARD_URL = "/api/v1/company/dashboard";

    private User pmeUser;

    @BeforeEach
    void setup() {
        pmeUser = new User("pme.need@test.com", passwordEncoder.encode("pass"), Role.PME);
        userRepository.save(pmeUser);
        Company company = new Company(
            "Empresa Need Test", "11.222.333/0001-81", "Tecnologia",
            "E_11_50", "R_1M_5M", "João Test", "pme.need@test.com", pmeUser
        );
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);
    }

    private NeedRequest validNeed() {
        return new NeedRequest(
            "CFO", "3-4", "6 meses", LocalDate.now().plusMonths(1),
            "Precisamos de um CFO para reestruturar nossas finanças e preparar a empresa para uma rodada de investimento série A.",
            "Modelo financeiro robusto e empresa apta para captação.",
            null
        );
    }

    @Test
    @WithMockUser(username = "pme.need@test.com", roles = "PME")
    void postNeed_dadosValidos_retorna201ComStatusReceived() throws Exception {
        mockMvc.perform(post(NEEDS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validNeed())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("RECEIVED"))
            .andExpect(jsonPath("$.cLevelType").value("CFO"))
            .andExpect(jsonPath("$.slaDeadline").exists());
    }

    @Test
    @WithMockUser(username = "pme.need@test.com", roles = "PME")
    void postNeed_comNecessidadeAtiva_retorna422() throws Exception {
        mockMvc.perform(post(NEEDS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validNeed())))
            .andExpect(status().isCreated());

        mockMvc.perform(post(NEEDS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validNeed())))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.detail").value("Você já possui uma necessidade ativa."));
    }

    @Test
    @WithMockUser(username = "pme.need@test.com", roles = "PME")
    void postNeed_descricaoMenos50Chars_retorna400() throws Exception {
        NeedRequest req = new NeedRequest(
            "CFO", "3-4", null, null,
            "Curto demais.",  // < 50 chars
            "Resultado esperado.", null
        );
        mockMvc.perform(post(NEEDS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.challengeDescription").exists());
    }

    @Test
    @WithMockUser(username = "pme.need@test.com", roles = "PME")
    void saveDraft_retorna201ComStatusDraft() throws Exception {
        mockMvc.perform(post(DRAFT_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validNeed())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    @WithMockUser(username = "pme.need@test.com", roles = "PME")
    void getDashboard_semNecessidade_retornaActiveNeedNull() throws Exception {
        mockMvc.perform(get(DASHBOARD_URL))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.companyName").value("Empresa Need Test"))
            .andExpect(jsonPath("$.activeNeed").isEmpty());
    }

    @Test
    @WithMockUser(username = "pme.need@test.com", roles = "PME")
    void getDashboard_comNecessidadeAtiva_retornaActiveNeed() throws Exception {
        mockMvc.perform(post(NEEDS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validNeed())))
            .andExpect(status().isCreated());

        mockMvc.perform(get(DASHBOARD_URL))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.activeNeed.status").value("RECEIVED"))
            .andExpect(jsonPath("$.activeNeed.slaDeadline").exists());
    }

    @Test
    @WithMockUser(username = "pme.need@test.com", roles = "EXECUTIVE")
    void postNeed_comRoleExecutive_retorna403() throws Exception {
        mockMvc.perform(post(NEEDS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validNeed())))
            .andExpect(status().isForbidden());
    }
}
