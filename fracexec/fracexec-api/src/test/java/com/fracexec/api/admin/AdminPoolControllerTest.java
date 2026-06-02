package com.fracexec.api.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.executive.dto.SaveProfileRequest;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminPoolControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String POOL_URL    = "/api/v1/admin/pool";
    private static final String PROFILE_URL = "/api/v1/executive/profile";

    private void createCompleteExecutiveProfile(String email) throws Exception {
        User exec = new User(email, passwordEncoder.encode("pass"), Role.EXECUTIVE);
        userRepository.save(exec);

        SaveProfileRequest req = new SaveProfileRequest(
            "Bio completa para pool.", "Resumo de experiência.",
            List.of("CFO"), List.of("Tecnologia"), java.util.Map.of());

        // Use SecurityMockMvcRequestPostProcessors instead of SecurityContextHolder
        // to avoid conflicting with @WithMockUser on the calling test method
        mockMvc.perform(put(PROFILE_URL)
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                    .authentication(new UsernamePasswordAuthenticationToken(exec, null, exec.getAuthorities())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }

    // ── 2.6 Pool tests ────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void pool_returns_only_complete_profiles() throws Exception {
        createCompleteExecutiveProfile("complete-exec@test.com");
        mockMvc.perform(get(POOL_URL))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void pool_filter_by_specialty_returns_matching() throws Exception {
        createCompleteExecutiveProfile("cfo-exec@test.com");
        mockMvc.perform(get(POOL_URL).param("specialty", "CFO"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].specialties[0]").value("CFO"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void pool_empty_returns_200_with_empty_list() throws Exception {
        mockMvc.perform(get(POOL_URL))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void pool_without_auth_returns_401() throws Exception {
        mockMvc.perform(get(POOL_URL)).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "EXECUTIVE")
    void pool_with_executive_returns_403() throws Exception {
        mockMvc.perform(get(POOL_URL)).andExpect(status().isForbidden());
    }

    // ── 2.5 Availability tests ────────────────────────────────────────────────

    @Test
    void availability_without_auth_returns_401() throws Exception {
        mockMvc.perform(patch(PROFILE_URL + "/availability")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"availabilityDaysPerMonth\":10,\"profileStatus\":\"ACTIVE\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void availability_update_updates_days_and_status() throws Exception {
        User exec = new User("avail@test.com", passwordEncoder.encode("pass"), Role.EXECUTIVE);
        userRepository.save(exec);
        var auth = new UsernamePasswordAuthenticationToken(exec, null, exec.getAuthorities());

        mockMvc.perform(patch(PROFILE_URL + "/availability")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                    .authentication(auth))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"availabilityDaysPerMonth\":15,\"profileStatus\":\"ACTIVE\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.availabilityDaysPerMonth").value(15))
            .andExpect(jsonPath("$.profileStatus").value("ACTIVE"));
    }

    @Test
    void availability_invalid_days_returns_400() throws Exception {
        User exec = new User("invalid-days@test.com", passwordEncoder.encode("pass"), Role.EXECUTIVE);
        userRepository.save(exec);
        var auth = new UsernamePasswordAuthenticationToken(exec, null, exec.getAuthorities());

        mockMvc.perform(patch(PROFILE_URL + "/availability")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
                    .authentication(auth))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"availabilityDaysPerMonth\":99,\"profileStatus\":\"ACTIVE\"}"))
            .andExpect(status().isBadRequest());
    }
}
