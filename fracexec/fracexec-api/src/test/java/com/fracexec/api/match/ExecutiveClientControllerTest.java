package com.fracexec.api.match;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.dto.ExecutiveClientRequest;
import com.fracexec.api.match.service.ConflictDetectionService;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExecutiveClientControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired ExecutiveClientRepository clientRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired ConflictDetectionService conflictDetectionService;

    private UUID profileId;

    @BeforeEach
    void setup() {
        User user = new User("exec.client@test.com", passwordEncoder.encode("pass"), Role.EXECUTIVE);
        userRepository.save(user);

        ExecutiveProfile profile = new ExecutiveProfile(user);
        profile.setBio("Bio de teste");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);
        profileId = profile.getId();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void criarCliente_dadosValidos_retorna201() throws Exception {
        var req = new ExecutiveClientRequest("62", "SP", "São Paulo", "E_51_200");
        mockMvc.perform(post("/api/v1/admin/executives/{id}/clients", profileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.cnae2digit").value("62"))
            .andExpect(jsonPath("$.regionState").value("SP"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void criarCliente_cnaeInvalido_retorna400() throws Exception {
        var req = new ExecutiveClientRequest("XX", "SP", null, null);
        mockMvc.perform(post("/api/v1/admin/executives/{id}/clients", profileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.cnae2digit").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void listarClientes_retornaLista() throws Exception {
        // Criar um cliente
        var req = new ExecutiveClientRequest("47", "RJ", "Rio de Janeiro", "E_11_50");
        mockMvc.perform(post("/api/v1/admin/executives/{id}/clients", profileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());

        // Listar
        mockMvc.perform(get("/api/v1/admin/executives/{id}/clients", profileId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].cnae2digit").value("47"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deletarCliente_retorna204() throws Exception {
        // Criar
        var req = new ExecutiveClientRequest("86", "MG", null, null);
        var result = mockMvc.perform(post("/api/v1/admin/executives/{id}/clients", profileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn();
        var body = objectMapper.readTree(result.getResponse().getContentAsString());
        var clientId = body.get("id").asText();

        // Deletar
        mockMvc.perform(delete("/api/v1/admin/executives/{pid}/clients/{cid}", profileId, clientId))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void detectarConflito_mesmosCnaeEEstado_retornaConflict() throws Exception {
        // Criar cliente com CNAE 62 em SP
        var req = new ExecutiveClientRequest("62", "SP", "São Paulo", "E_51_200");
        mockMvc.perform(post("/api/v1/admin/executives/{id}/clients", profileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());

        // Verificar conflito
        var result = conflictDetectionService.check(profileId, "62", "SP");
        assert result == ConflictDetectionService.ConflictResult.CONFLICT;
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void detectarConflito_estadoDiferente_retornaClear() throws Exception {
        var req = new ExecutiveClientRequest("62", "SP", null, null);
        mockMvc.perform(post("/api/v1/admin/executives/{id}/clients", profileId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());

        // Mesmo CNAE, estado diferente → CLEAR
        var result = conflictDetectionService.check(profileId, "62", "RJ");
        assert result == ConflictDetectionService.ConflictResult.CLEAR;
    }
}
