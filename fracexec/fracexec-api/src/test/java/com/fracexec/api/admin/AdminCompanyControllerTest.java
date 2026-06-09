package com.fracexec.api.admin;

import com.fracexec.api.company.Company;
import com.fracexec.api.company.CompanyRepository;
import com.fracexec.api.company.CompanyStatus;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminCompanyControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String companyId;

    @BeforeEach
    void setup() {
        User pme = new User("pme.acc@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company co = new Company("Empresa ACC", "33.333.333/0001-33", "Saúde",
            "E_11_50", "R_1M_5M", "Resp", "pme.acc@test.com", pme);
        co.setStatus(CompanyStatus.PENDING_ACTIVATION);
        companyRepository.save(co);
        companyId = co.getId().toString();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_retornaEmpresas() throws Exception {
        mockMvc.perform(get("/api/v1/admin/companies"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].legalName").value("Empresa ACC"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_filtraPorStatus() throws Exception {
        mockMvc.perform(get("/api/v1/admin/companies?status=PENDING_ACTIVATION"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].status").value("PENDING_ACTIVATION"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_statusInvalido_retorna400() throws Exception {
        mockMvc.perform(get("/api/v1/admin/companies?status=INVALIDO"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void activate_mudaStatusParaActive() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/companies/{id}/activate", companyId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void activate_naoEncontrado_retorna404() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/companies/{id}/activate",
                java.util.UUID.randomUUID()))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "PME")
    void list_rolePME_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/companies"))
            .andExpect(status().isForbidden());
    }
}
