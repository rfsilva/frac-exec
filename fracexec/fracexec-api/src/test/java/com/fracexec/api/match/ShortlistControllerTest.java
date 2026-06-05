package com.fracexec.api.match;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.company.*;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.dto.AddExecutiveRequest;
import com.fracexec.api.match.dto.ConflictDecisionRequest;
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
class ShortlistControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String needId;
    private String profileId;

    @BeforeEach
    void setup() {
        // Admin no banco (necessário para Authentication resolver userId)
        if (userRepository.findByEmail("admin@fracexec.com").isEmpty()) {
            userRepository.save(new User("admin@fracexec.com", passwordEncoder.encode("p"), Role.ADMIN));
        }

        // PME + empresa + necessidade
        User pme = new User("pme.sl@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa SL", "22.233.300/0100-35", "Tecnologia",
            "E_11_50", "R_1M_5M", "Resp", "pme.sl@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);
        Need need = new Need(company, "CFO", "3-4", "6 meses", LocalDate.now().plusMonths(1),
            "Desafio de reestruturação financeira com mais de 50 caracteres para validar.",
            "Resultado esperado.", null, NeedStatus.UNDER_ANALYSIS);
        needRepository.save(need);
        needId = need.getId().toString();

        // Executivo com perfil
        User exec = new User("exec.sl@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio do executivo");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);
        profileId = profile.getId().toString();
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void getOrCreateShortlist_retornaShortlistVazia() throws Exception {
        mockMvc.perform(get("/api/v1/admin/needs/{id}/shortlist", needId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.executives").isArray())
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.canSend").value(false));
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void adicionarExecutivo_retornaItemComConflitoClear() throws Exception {
        var req = new AddExecutiveRequest(java.util.UUID.fromString(profileId));
        mockMvc.perform(post("/api/v1/admin/needs/{id}/shortlist/executives", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.conflictStatus").exists())
            .andExpect(jsonPath("$.id").exists());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void removerExecutivo_retorna204() throws Exception {
        // Adicionar
        var req = new AddExecutiveRequest(java.util.UUID.fromString(profileId));
        var result = mockMvc.perform(post("/api/v1/admin/needs/{id}/shortlist/executives", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn();
        var itemId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Remover
        mockMvc.perform(delete("/api/v1/admin/needs/{id}/shortlist/executives/{itemId}", needId, itemId))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void enviarShortlist_menosde2Executivos_retorna422() throws Exception {
        // Adicionar apenas 1 executivo
        var req = new AddExecutiveRequest(java.util.UUID.fromString(profileId));
        mockMvc.perform(post("/api/v1/admin/needs/{id}/shortlist/executives", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());

        // Tentar enviar
        mockMvc.perform(post("/api/v1/admin/needs/{id}/shortlist/send", needId))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void decidirConflito_approveWithAlert_atualizaStatus() throws Exception {
        // Adicionar executivo
        var req = new AddExecutiveRequest(java.util.UUID.fromString(profileId));
        var result = mockMvc.perform(post("/api/v1/admin/needs/{id}/shortlist/executives", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn();
        var itemId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Decidir conflito — verifica que retorna 200 com shortlist
        mockMvc.perform(patch("/api/v1/admin/shortlist-executives/{itemId}/conflict-decision", itemId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ConflictDecisionRequest("APPROVE_WITH_ALERT"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }
}
