package com.fracexec.api.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.executive.dto.ApplicationPositionDto;
import com.fracexec.api.executive.dto.ApplicationReferenceDto;
import com.fracexec.api.executive.dto.ApplicationRequest;
import com.fracexec.api.executive.dto.RejectRequest;
import com.fracexec.api.executive.dto.UpdateStatusRequest;
import com.fracexec.api.executive.model.ApplicationStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminApplicationControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static final String LIST_URL  = "/api/v1/admin/applications";
    private static final String APPLY_URL = "/api/v1/applications";

    private String createApplication(String email) throws Exception {
        ApplicationRequest req = new ApplicationRequest(
            "Maria Admin", email, "https://linkedin.com/in/maria",
            List.of(new ApplicationPositionDto("CFO", null,
                LocalDate.of(2020, 1, 1), null, null, null)),
            List.of(
                new ApplicationReferenceDto("Ref A", "CEO", "a@b.com"),
                new ApplicationReferenceDto("Ref B", "CTO", "b@c.com")),
            "Motivação teste", true);

        String response = mockMvc.perform(post(APPLY_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    @WithMockUser(roles = "ADMIN")
    private String advanceToUnderReview(String id) throws Exception {
        UpdateStatusRequest req = new UpdateStatusRequest(ApplicationStatus.UNDER_REVIEW);
        mockMvc.perform(patch(LIST_URL + "/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
        return id;
    }

    // ── Listagem ──────────────────────────────────────────────────────────────

    @Test
    void list_without_auth_returns_401() throws Exception {
        mockMvc.perform(get(LIST_URL)).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "EXECUTIVE")
    void list_with_executive_role_returns_403() throws Exception {
        mockMvc.perform(get(LIST_URL)).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_with_admin_returns_200() throws Exception {
        createApplication("list-test@test.com");
        mockMvc.perform(get(LIST_URL))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void list_filter_by_status_returns_matching() throws Exception {
        createApplication("filter-test@test.com");
        mockMvc.perform(get(LIST_URL).param("status", "PENDING"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }

    // ── PATCH status ──────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void patch_status_pending_to_under_review_returns_200() throws Exception {
        String id = createApplication("patch-test@test.com");
        UpdateStatusRequest req = new UpdateStatusRequest(ApplicationStatus.UNDER_REVIEW);
        mockMvc.perform(patch(LIST_URL + "/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void patch_invalid_transition_returns_422() throws Exception {
        String id = createApplication("invalid-transition@test.com");
        UpdateStatusRequest req = new UpdateStatusRequest(ApplicationStatus.APPROVED);
        mockMvc.perform(patch(LIST_URL + "/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnprocessableEntity());
    }

    // ── GET detalhe ───────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void get_detail_returns_full_application() throws Exception {
        String id = createApplication("detail-test@test.com");
        mockMvc.perform(get(LIST_URL + "/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id))
            .andExpect(jsonPath("$.positions").isArray())
            .andExpect(jsonPath("$.references").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void get_nonexistent_returns_404() throws Exception {
        mockMvc.perform(get(LIST_URL + "/" + UUID.randomUUID()))
            .andExpect(status().isNotFound());
    }

    // ── Aprovação ─────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void approve_under_review_returns_approved() throws Exception {
        String id = createApplication("approve-test@test.com");
        // Avançar para UNDER_REVIEW primeiro
        mockMvc.perform(patch(LIST_URL + "/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new UpdateStatusRequest(ApplicationStatus.UNDER_REVIEW))))
            .andExpect(status().isOk());

        mockMvc.perform(post(LIST_URL + "/" + id + "/approve"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approve_pending_returns_422() throws Exception {
        String id = createApplication("approve-pending@test.com");
        // Tentar aprovar sem UNDER_REVIEW → 422
        mockMvc.perform(post(LIST_URL + "/" + id + "/approve"))
            .andExpect(status().isUnprocessableEntity());
    }

    // ── Rejeição ──────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void reject_under_review_returns_rejected_with_reapply_date() throws Exception {
        String id = createApplication("reject-test@test.com");
        mockMvc.perform(patch(LIST_URL + "/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new UpdateStatusRequest(ApplicationStatus.UNDER_REVIEW))))
            .andExpect(status().isOk());

        mockMvc.perform(post(LIST_URL + "/" + id + "/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RejectRequest("Perfil não atende aos critérios atuais"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    // ── Cooldown após rejeição (AC-6) ─────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void reapply_within_cooldown_returns_422() throws Exception {
        String email = "cooldown@test.com";
        String id = createApplication(email);

        // UNDER_REVIEW → REJECTED
        mockMvc.perform(patch(LIST_URL + "/" + id + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new UpdateStatusRequest(ApplicationStatus.UNDER_REVIEW))))
            .andExpect(status().isOk());
        mockMvc.perform(post(LIST_URL + "/" + id + "/reject")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RejectRequest("Motivo de teste"))))
            .andExpect(status().isOk());

        // Tentar nova candidatura com mesmo email dentro do cooldown → 422
        ApplicationRequest newReq = new ApplicationRequest(
            "Maria Admin", email, "https://linkedin.com/in/maria",
            List.of(new ApplicationPositionDto("CFO", null,
                LocalDate.of(2021, 1, 1), null, null, null)),
            List.of(
                new ApplicationReferenceDto("Ref A", "CEO", "a@b.com"),
                new ApplicationReferenceDto("Ref B", "CTO", "b@c.com")),
            "Nova motivação", true);

        mockMvc.perform(post(APPLY_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newReq)))
            .andExpect(status().isUnprocessableEntity());
    }
}
