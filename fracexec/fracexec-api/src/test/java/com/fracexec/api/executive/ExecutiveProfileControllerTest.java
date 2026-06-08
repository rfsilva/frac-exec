package com.fracexec.api.executive;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.executive.dto.SaveProfileRequest;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExecutiveProfileControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String BASE = "/api/v1/executive/profile";

    private User execUser;

    @BeforeEach
    void setup() {
        execUser = new User("exec@test.com", passwordEncoder.encode("password"), Role.EXECUTIVE);
        userRepository.save(execUser);
        // Coloca o User no SecurityContext para que o controller possa fazer o cast
        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(execUser, null, execUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void get_without_auth_returns_401() throws Exception {
        SecurityContextHolder.clearContext();
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
    }

    @Test
    void get_profile_without_saved_profile_returns_empty() throws Exception {
        mockMvc.perform(get(BASE))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isComplete").value(false));
    }

    @Test
    void complete_without_profile_returns_false() throws Exception {
        mockMvc.perform(get(BASE + "/complete"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.complete").value(false));
    }

    @Test
    void save_profile_with_bio_and_specialties_returns_complete() throws Exception {
        SaveProfileRequest req = new SaveProfileRequest(
            "Executivo C-Level com 20 anos de experiência em finanças corporativas.",
            "Liderança de equipes de até 500 pessoas.",
            List.of("CFO", "COO"),
            List.of("Tecnologia", "Varejo"),
            Map.of()
        );

        mockMvc.perform(put(BASE)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isComplete").value(true))
            .andExpect(jsonPath("$.specialties[0]").value("CFO"));
    }

    @Test
    void complete_after_save_returns_true() throws Exception {
        SaveProfileRequest req = new SaveProfileRequest(
            "Bio preenchida com conteúdo suficiente.", null,
            List.of("CTO"), List.of(), Map.of()
        );

        mockMvc.perform(put(BASE)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());

        mockMvc.perform(get(BASE + "/complete"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.complete").value(true));
    }
}
