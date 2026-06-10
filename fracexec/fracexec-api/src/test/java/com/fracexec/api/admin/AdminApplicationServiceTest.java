package com.fracexec.api.admin;

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

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminApplicationServiceTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final AtomicInteger counter = new AtomicInteger(0);

    @BeforeEach
    void setup() {
        if (userRepository.findByEmail("admin@fracexec.com").isEmpty()) {
            userRepository.save(new User("admin@fracexec.com", passwordEncoder.encode("p"), Role.ADMIN));
        }
    }

    private String createApplication(String suffix) throws Exception {
        String body = """
            {"fullName":"Test %s","email":"svc.%s@test.com",
             "linkedinUrl":"https://linkedin.com/in/svc-%s",
             "positions":[{"roleTitle":"CFO","companyName":"Emp","periodStart":"2020-01-01",
               "periodEnd":null,"teamSize":null,"revenueManaged":null}],
             "references":[{"refName":"R1","refRole":"CEO","refContact":"r1@t.com"},
               {"refName":"R2","refRole":"CTO","refContact":"r2@t.com"}],
             "motivation":"Motivação para candidatura de teste.","lgpdConsent":true}
            """.formatted(suffix, suffix, suffix);

        String resp = mockMvc.perform(post("/api/v1/applications")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        return com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
            .readTree(resp).get("id").asText();
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void updateStatus_pendingParaUnderReview_aceita() throws Exception {
        String id = createApplication("ur" + counter.incrementAndGet());
        mockMvc.perform(patch("/api/v1/admin/applications/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"UNDER_REVIEW\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void updateStatus_transicaoInvalida_retorna422() throws Exception {
        String id = createApplication("ti" + counter.incrementAndGet());
        // PENDING → APPROVED não é transição válida (precisa passar por UNDER_REVIEW)
        mockMvc.perform(patch("/api/v1/admin/applications/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"APPROVED\"}"))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void approve_estadoErrado_retorna422() throws Exception {
        String id = createApplication("ae" + counter.incrementAndGet());
        // Tentar aprovar PENDING — não permitido
        mockMvc.perform(post("/api/v1/admin/applications/" + id + "/approve"))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void approve_underReview_retorna200() throws Exception {
        String id = createApplication("aok" + counter.incrementAndGet());
        // Avança para UNDER_REVIEW
        mockMvc.perform(patch("/api/v1/admin/applications/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"UNDER_REVIEW\"}"))
            .andExpect(status().isOk());
        // Aprova
        mockMvc.perform(post("/api/v1/admin/applications/" + id + "/approve"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void reject_underReview_setaCanReapplyAfter() throws Exception {
        String id = createApplication("rej" + counter.incrementAndGet());
        mockMvc.perform(patch("/api/v1/admin/applications/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"UNDER_REVIEW\"}"))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/admin/applications/" + id + "/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rejectionReason\":\"Perfil não adequado para a vaga.\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void reject_estadoErrado_retorna422() throws Exception {
        String id = createApplication("rbe" + counter.incrementAndGet());
        // Tentar rejeitar PENDING direto
        mockMvc.perform(post("/api/v1/admin/applications/" + id + "/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rejectionReason\":\"Motivo.\"}"))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void updateStatus_rejeitar_setaCanReapplyAfter() throws Exception {
        String id = createApplication("rca" + counter.incrementAndGet());
        mockMvc.perform(patch("/api/v1/admin/applications/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"UNDER_REVIEW\"}"))
            .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/admin/applications/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"REJECTED\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void getApplication_naoEncontrado_retorna404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/applications/" + UUID.randomUUID()))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void listApplications_comFiltroStatus_retornaLista() throws Exception {
        mockMvc.perform(get("/api/v1/admin/applications?status=PENDING"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }
}
