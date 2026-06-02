package com.fracexec.api.executive;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.executive.dto.ApplicationPositionDto;
import com.fracexec.api.executive.dto.ApplicationReferenceDto;
import com.fracexec.api.executive.dto.ApplicationRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExecutiveApplicationControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static final String APPLY = "/api/v1/applications";

    private ApplicationRequest validRequest(String email) {
        return new ApplicationRequest(
            "João Silva",
            email,
            "https://linkedin.com/in/joaosilva",
            List.of(new ApplicationPositionDto("CFO", "Empresa XYZ",
                LocalDate.of(2020, 1, 1), LocalDate.of(2023, 12, 31),
                "50 pessoas", "R$100M")),
            List.of(
                new ApplicationReferenceDto("Maria Souza", "CEO", "maria@empresa.com"),
                new ApplicationReferenceDto("Carlos Lima", "CTO", "carlos@empresa.com")
            ),
            "Quero contribuir com minha experiência de gestão.",
            true
        );
    }

    @Test
    void submit_valid_application_returns_201() throws Exception {
        mockMvc.perform(post(APPLY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest("exec1@test.com"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void submit_without_lgpd_returns_400() throws Exception {
        ApplicationRequest noLgpd = new ApplicationRequest(
            "João Silva", "exec2@test.com",
            "https://linkedin.com/in/joao",
            List.of(new ApplicationPositionDto("CFO", null,
                LocalDate.of(2020, 1, 1), null, null, null)),
            List.of(
                new ApplicationReferenceDto("Ref A", "CEO", "a@b.com"),
                new ApplicationReferenceDto("Ref B", "CTO", "b@c.com")
            ),
            "Motivação",
            false   // LGPD não marcado
        );
        mockMvc.perform(post(APPLY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(noLgpd)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void submit_with_only_one_reference_returns_400() throws Exception {
        ApplicationRequest oneRef = new ApplicationRequest(
            "João Silva", "exec3@test.com",
            "https://linkedin.com/in/joao",
            List.of(new ApplicationPositionDto("CFO", null,
                LocalDate.of(2020, 1, 1), null, null, null)),
            List.of(new ApplicationReferenceDto("Ref A", "CEO", "a@b.com")),  // só 1
            "Motivação",
            true
        );
        mockMvc.perform(post(APPLY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(oneRef)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void submit_without_positions_returns_400() throws Exception {
        ApplicationRequest noPos = new ApplicationRequest(
            "João Silva", "exec4@test.com",
            "https://linkedin.com/in/joao",
            List.of(),  // sem posições
            List.of(
                new ApplicationReferenceDto("Ref A", "CEO", "a@b.com"),
                new ApplicationReferenceDto("Ref B", "CTO", "b@c.com")
            ),
            "Motivação",
            true
        );
        mockMvc.perform(post(APPLY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(noPos)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void submit_duplicate_email_with_pending_returns_409() throws Exception {
        String body = objectMapper.writeValueAsString(validRequest("dup@test.com"));

        // Primeira submissão — OK
        mockMvc.perform(post(APPLY).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        // Segunda submissão — duplicata
        mockMvc.perform(post(APPLY).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void submit_with_invalid_linkedin_url_returns_400() throws Exception {
        ApplicationRequest badUrl = new ApplicationRequest(
            "João Silva", "exec5@test.com",
            "https://twitter.com/joao",  // URL inválida — não é LinkedIn
            List.of(new ApplicationPositionDto("CFO", null,
                LocalDate.of(2020, 1, 1), null, null, null)),
            List.of(
                new ApplicationReferenceDto("Ref A", "CEO", "a@b.com"),
                new ApplicationReferenceDto("Ref B", "CTO", "b@c.com")
            ),
            "Motivação",
            true
        );
        mockMvc.perform(post(APPLY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(badUrl)))
            .andExpect(status().isBadRequest());
    }
}
