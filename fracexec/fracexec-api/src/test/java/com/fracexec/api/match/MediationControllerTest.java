package com.fracexec.api.match;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.company.*;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.dto.SendMessageRequest;
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
class MediationControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String needId;
    private final String pmeEmail   = "pme.med@test.com";
    private final String adminEmail = "admin.med@test.com";

    @BeforeEach
    void setup() {
        userRepository.save(new User(adminEmail, passwordEncoder.encode("p"), Role.ADMIN));

        User pme = new User(pmeEmail, passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa MED", "12.345.678/0001-90", "Tecnologia",
            "E_11_50", "R_1M_5M", "Resp", pmeEmail, pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1),
            "Desafio de mediação para teste.",
            "Resultado esperado.", null, NeedStatus.IN_MEDIATION);
        needRepository.save(need);
        needId = need.getId().toString();

        User exec = new User("exec.med@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio MED.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);
    }

    @Test
    @WithMockUser(username = "admin.med@test.com", roles = "ADMIN")
    void adminGetMessages_semMensagens_retornaListaVazia() throws Exception {
        mockMvc.perform(get("/api/v1/admin/needs/{needId}/messages", needId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @WithMockUser(username = "admin.med@test.com", roles = "ADMIN")
    void adminPostMessage_conteudoValido_retorna201() throws Exception {
        var req = new SendMessageRequest("Mensagem de teste do admin para mediação.");
        mockMvc.perform(post("/api/v1/admin/needs/{needId}/messages", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.senderRole").value("ADMIN"))
            .andExpect(jsonPath("$.content").value("Mensagem de teste do admin para mediação."));
    }

    @Test
    @WithMockUser(username = "admin.med@test.com", roles = "ADMIN")
    void adminGetMessages_needInexistente_retorna404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/needs/{needId}/messages",
                java.util.UUID.randomUUID()))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "pme.med@test.com", roles = "PME")
    void pmeGetMessages_propriaNeed_retornaLista() throws Exception {
        mockMvc.perform(get("/api/v1/company/needs/{needId}/messages", needId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "exec.med@test.com", roles = "EXECUTIVE")
    void execGetMessages_retornaLista() throws Exception {
        mockMvc.perform(get("/api/v1/executive/needs/{needId}/messages", needId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "pme.med@test.com", roles = "PME")
    void pmeContactAdmin_mensagemValida_retorna201() throws Exception {
        var req = new SendMessageRequest("Preciso de suporte do admin.");
        mockMvc.perform(post("/api/v1/company/needs/{needId}/contact-admin", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "exec.med@test.com", roles = "EXECUTIVE")
    void execContactAdmin_mensagemValida_retorna201() throws Exception {
        var req = new SendMessageRequest("Executivo precisa de suporte.");
        mockMvc.perform(post("/api/v1/executive/needs/{needId}/contact-admin", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "admin.med@test.com", roles = "ADMIN")
    void adminPostMessage_bodyVazio_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/admin/needs/{needId}/messages", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }
}
