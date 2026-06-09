package com.fracexec.api.executive;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.company.*;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.*;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ExecutiveOpportunityControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired ShortlistRepository shortlistRepository;
    @Autowired ShortlistExecutiveRepository shortlistExecutiveRepository;
    @Autowired ExecutiveOpportunityRepository opportunityRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String oppId;
    private final String execEmail = "exec.opp@test.com";

    @BeforeEach
    void setup() {
        User pme = new User("pme.opp@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa OPP", "33.444.555/0001-66", "Tecnologia",
            "E_11_50", "R_1M_5M", "Resp", "pme.opp@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1),
            "Desafio financeiro para captação de série A.",
            "Empresa pronta para crescimento.", null, NeedStatus.IN_MEDIATION);
        needRepository.save(need);

        User exec = new User(execEmail, passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio OPP.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        Shortlist sl = new Shortlist(need);
        shortlistRepository.save(sl);
        ShortlistExecutive slExec = new ShortlistExecutive(sl, profile, ConflictStatus.CLEAR);
        shortlistExecutiveRepository.save(slExec);

        ExecutiveOpportunity opp = new ExecutiveOpportunity(slExec, profile, need,
            Instant.now().plusSeconds(259200));
        opportunityRepository.save(opp);
        oppId = opp.getId().toString();
    }

    @Test
    @WithMockUser(username = "exec.opp@test.com", roles = "EXECUTIVE")
    void list_retornaAtivosEHistorico() throws Exception {
        mockMvc.perform(get("/api/v1/executive/opportunities"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").isArray())
            .andExpect(jsonPath("$.history").isArray())
            .andExpect(jsonPath("$.active[0].status").value("AVAILABLE"));
    }

    @Test
    @WithMockUser(username = "exec.opp@test.com", roles = "EXECUTIVE")
    void declararInteresse_disponivel_retornaInterested() throws Exception {
        mockMvc.perform(post("/api/v1/executive/opportunities/{id}/interest", oppId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("INTERESTED"));
    }

    @Test
    @WithMockUser(username = "exec.opp@test.com", roles = "EXECUTIVE")
    void declararInteresse_jaRespondido_retorna422() throws Exception {
        // Declara interesse primeiro
        mockMvc.perform(post("/api/v1/executive/opportunities/{id}/interest", oppId))
            .andExpect(status().isOk());
        // Tenta de novo
        mockMvc.perform(post("/api/v1/executive/opportunities/{id}/interest", oppId))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "exec.opp@test.com", roles = "EXECUTIVE")
    void declinar_disponivel_retornaDeclined() throws Exception {
        mockMvc.perform(post("/api/v1/executive/opportunities/{id}/decline", oppId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("reason", "Agenda indisponível"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DECLINED"));
    }

    @Test
    @WithMockUser(username = "exec.opp@test.com", roles = "EXECUTIVE")
    void retratar_aposInteresse_retornaRetracted() throws Exception {
        mockMvc.perform(post("/api/v1/executive/opportunities/{id}/interest", oppId))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/executive/opportunities/{id}/retract", oppId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("RETRACTED"));
    }
}
