package com.fracexec.api.shared.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.shared.auth.dto.ForgotPasswordRequest;
import com.fracexec.api.shared.auth.dto.LoginRequest;
import com.fracexec.api.shared.auth.dto.RefreshTokenRequest;
import com.fracexec.api.shared.auth.dto.RegisterRequest;
import com.fracexec.api.shared.auth.model.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static final String REGISTER = "/api/v1/auth/register";
    private static final String LOGIN    = "/api/v1/auth/login";
    private static final String REFRESH  = "/api/v1/auth/refresh";

    @Test
    void register_executive_returns_201_with_tokens() throws Exception {
        mockMvc.perform(post(REGISTER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("exec@test.com", "password123", Role.EXECUTIVE))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.role").value("EXECUTIVE"))
            .andExpect(jsonPath("$.email").value("exec@test.com"));
    }

    @Test
    void register_pme_returns_201() throws Exception {
        mockMvc.perform(post(REGISTER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("pme@test.com", "password123", Role.PME))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("PME"));
    }

    @Test
    void register_admin_returns_400() throws Exception {
        mockMvc.perform(post(REGISTER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("admin@test.com", "password123", Role.ADMIN))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void register_duplicate_email_returns_422() throws Exception {
        String body = json(new RegisterRequest("dup@test.com", "password123", Role.EXECUTIVE));
        mockMvc.perform(post(REGISTER).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());
        mockMvc.perform(post(REGISTER).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void login_valid_credentials_returns_200() throws Exception {
        mockMvc.perform(post(REGISTER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("login@test.com", "password123", Role.EXECUTIVE))))
            .andExpect(status().isCreated());

        mockMvc.perform(post(LOGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new LoginRequest("login@test.com", "password123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void login_wrong_password_returns_401() throws Exception {
        mockMvc.perform(post(REGISTER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("badpass@test.com", "password123", Role.EXECUTIVE))))
            .andExpect(status().isCreated());

        mockMvc.perform(post(LOGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new LoginRequest("badpass@test.com", "wrongpassword"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_valid_token_returns_200() throws Exception {
        String registerBody = objectMapper.writeValueAsString(
            new RegisterRequest("refresh@test.com", "password123", Role.EXECUTIVE));
        String responseStr = mockMvc.perform(post(REGISTER)
                .contentType(MediaType.APPLICATION_JSON).content(registerBody))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String refreshToken = objectMapper.readTree(responseStr).get("refreshToken").asText();

        mockMvc.perform(post(REFRESH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RefreshTokenRequest(refreshToken))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void refresh_invalid_token_returns_4xx() throws Exception {
        mockMvc.perform(post(REFRESH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RefreshTokenRequest("invalid-token-value"))))
            .andExpect(status().is4xxClientError());
    }

    @Test
    void request_without_token_to_protected_route_returns_4xx() throws Exception {
        mockMvc.perform(post("/api/v1/executive/test"))
            .andExpect(status().is4xxClientError());
    }

    @Test
    void forgot_password_always_returns_200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new ForgotPasswordRequest("nonexistent@test.com"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").isNotEmpty());

        mockMvc.perform(post(REGISTER)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new RegisterRequest("exists@test.com", "password123", Role.EXECUTIVE))))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new ForgotPasswordRequest("exists@test.com"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").isNotEmpty());
    }

    private String json(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }
}
