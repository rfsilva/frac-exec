package com.fracexec.api.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.admin.need.AdminNeedStatusRequest;
import com.fracexec.api.company.*;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminNeedControllerTest {

    @Autowired MockMvc            mockMvc;
    @Autowired ObjectMapper       objectMapper;
    @Autowired UserRepository     userRepository;
    @Autowired CompanyRepository  companyRepository;
    @Autowired NeedRepository     needRepository;
    @Autowired PasswordEncoder    passwordEncoder;

    private Need savedNeed;

    @BeforeEach
    void setup() {
        User pme = new User("pme.admin.need@test.com",
                passwordEncoder.encode("pass"), Role.PME);
        userRepository.save(pme);

        Company company = new Company(
            "Empresa AdminNeed", "22.233.300/0100-35", "Saúde",
            "E_51_200", "R_5M_20M", "Maria Admin", "pme.admin.need@test.com", pme
        );
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        savedNeed = new Need(
            company, "CTO", "5-8", "12 meses", null,
            "Precisamos de um CTO para liderar a transformação digital da empresa e modernizar nossa infraestrutura de tecnologia.",
            "Infraestrutura modernizada e time de tecnologia estruturado.",
            "Contexto confidencial: empresa passando por restruturação.",
            NeedStatus.RECEIVED
        );
        needRepository.save(savedNeed);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listNeeds_semFiltros_retornaLista() throws Exception {
        mockMvc.perform(get("/api/v1/admin/needs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].cLevelType").value("CTO"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listNeeds_filtroStatus_retornaFiltrado() throws Exception {
        mockMvc.perform(get("/api/v1/admin/needs?status=RECEIVED"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].status").value("RECEIVED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getNeedDetail_retornaConfidentialContext() throws Exception {
        mockMvc.perform(get("/api/v1/admin/needs/" + savedNeed.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.confidentialContext").value("Contexto confidencial: empresa passando por restruturação."))
            .andExpect(jsonPath("$.challengeDescription").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void patchStatus_paraUnderAnalysis_atualiza() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/needs/" + savedNeed.getId() + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new AdminNeedStatusRequest("UNDER_ANALYSIS"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UNDER_ANALYSIS"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void patchStatus_statusInvalido_retorna400() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/needs/" + savedNeed.getId() + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new AdminNeedStatusRequest("INVALIDO"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listCompanies_retornaEmpresas() throws Exception {
        mockMvc.perform(get("/api/v1/admin/companies"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }
}
