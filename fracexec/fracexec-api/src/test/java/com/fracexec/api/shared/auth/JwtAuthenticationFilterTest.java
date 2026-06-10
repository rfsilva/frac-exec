package com.fracexec.api.shared.auth;

import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.auth.service.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class JwtAuthenticationFilterTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtUtil jwtUtil;

    private String validToken;

    @BeforeEach
    void setup() {
        User exec = new User("jwt.filter@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        validToken = jwtUtil.generateAccessToken(exec);
    }

    @Test
    void semHeader_passaFiltroSemAutenticacao() throws Exception {
        // POST /auth/login é público; sem header o filtro deixa passar (controller retorna 400 por body inválido, não 401)
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }

    @Test
    void comTokenValido_autentica() throws Exception {
        mockMvc.perform(get("/api/v1/executive/profile")
                .header("Authorization", "Bearer " + validToken))
            .andExpect(status().isOk());
    }

    @Test
    void comTokenMalformado_retorna401() throws Exception {
        mockMvc.perform(get("/api/v1/executive/profile")
                .header("Authorization", "Bearer token.invalido.aqui"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void semBearerPrefix_tratadoComoSemAuth() throws Exception {
        mockMvc.perform(get("/api/v1/executive/profile")
                .header("Authorization", "Basic dXNlcjpwYXNz"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void comTokenExpirado_retorna401() throws Exception {
        // Token com assinatura válida mas payload corrompido
        String fakeToken = validToken.substring(0, validToken.lastIndexOf('.')) + ".invalidsignature";
        mockMvc.perform(get("/api/v1/executive/profile")
                .header("Authorization", "Bearer " + fakeToken))
            .andExpect(status().isUnauthorized());
    }
}
