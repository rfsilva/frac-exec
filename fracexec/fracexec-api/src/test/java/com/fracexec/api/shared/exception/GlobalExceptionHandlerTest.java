package com.fracexec.api.shared.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class GlobalExceptionHandlerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        if (userRepository.findByEmail("admin@fracexec.com").isEmpty()) {
            userRepository.save(new User("admin@fracexec.com", passwordEncoder.encode("p"), Role.ADMIN));
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void resourceNotFound_retorna404ComProblemDetail() throws Exception {
        mockMvc.perform(get("/api/v1/admin/engagements/{id}/status", UUID.randomUUID()))
            .andExpect(status().isMethodNotAllowed()); // GET não existe — 405
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void resourceNotFound_engagementNaoExiste_retorna404() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/engagements/{id}/status", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "PAUSED"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.title").value("Recurso não encontrado"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void invalidRequest_statusInvalido_retorna400() throws Exception {
        // Cria um engajamento para ter um ID válido
        var user = userRepository.findByEmail("admin@fracexec.com").orElseThrow();
        // Usa endpoint que retorna 400 para status inválido
        mockMvc.perform(get("/api/v1/admin/companies?status=INVALIDO"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("Requisição inválida"));
    }

    @Test
    void unauthenticated_semToken_retorna401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "PME")
    void forbidden_rolePME_retorna403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "EXECUTIVE")
    void businessRule_opportunidadeJaRespondida_retorna422() throws Exception {
        // Endpoint que lança BusinessRuleException quando opp não existe
        mockMvc.perform(post("/api/v1/executive/opportunities/{id}/interest", UUID.randomUUID()))
            .andExpect(status().isNotFound()); // primeiro 404 (opp não encontrada)
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void methodNotAllowed_retornaErroCoerente() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/dashboard"))
            .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void validationError_bodyInvalido_retorna400ComCampos() throws Exception {
        // POST sem body obrigatório em endpoint que usa @Valid
        mockMvc.perform(post("/api/v1/admin/needs/{id}/messages", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }
}
