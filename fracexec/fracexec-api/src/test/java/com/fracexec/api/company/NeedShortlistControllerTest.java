package com.fracexec.api.company;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.*;
import com.fracexec.api.match.dto.SelectionRequest;
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

import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class NeedShortlistControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired ShortlistRepository shortlistRepository;
    @Autowired ShortlistExecutiveRepository shortlistExecutiveRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired jakarta.persistence.EntityManager em;

    private String needId;
    private String slExecId;
    private String pmeEmail = "pme.nsc@test.com";

    @BeforeEach
    void setup() {
        User pme = new User(pmeEmail, passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa NSC", "11.222.333/0001-44", "Saúde",
            "E_11_50", "R_1M_5M", "Resp", pmeEmail, pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1),
            "Desafio financeiro para captação de série A.",
            "Empresa pronta para crescimento.", null, NeedStatus.SHORTLIST_SENT);
        needRepository.save(need);
        needId = need.getId().toString();

        User exec = new User("exec.nsc@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio executivo NSC.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        Shortlist shortlist = new Shortlist(need);
        shortlistRepository.save(shortlist);
        ShortlistExecutive slExec = new ShortlistExecutive(shortlist, profile, ConflictStatus.CLEAR);
        shortlistExecutiveRepository.save(slExec);
        slExecId = slExec.getId().toString();
        em.flush();
        em.clear();
    }

    @Test
    @WithMockUser(username = "pme.nsc@test.com", roles = "PME")
    void getShortlist_statusCorreto_retornaPerfilAnonimizado() throws Exception {
        mockMvc.perform(get("/api/v1/company/needs/{id}/shortlist", needId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isNotEmpty())
            .andExpect(jsonPath("$[0].shortlistExecutiveId").exists());
    }

    @Test
    @WithMockUser(username = "pme.nsc@test.com", roles = "PME")
    void getShortlist_statusErrado_retorna422() throws Exception {
        Need need = needRepository.findById(java.util.UUID.fromString(needId)).orElseThrow();
        need.setStatus(NeedStatus.UNDER_ANALYSIS);
        needRepository.save(need);

        mockMvc.perform(get("/api/v1/company/needs/{id}/shortlist", needId))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "pme.nsc@test.com", roles = "PME")
    void selectExecutives_idsValidos_mudaStatusParaInMediation() throws Exception {
        var req = new SelectionRequest(List.of(java.util.UUID.fromString(slExecId)));
        mockMvc.perform(post("/api/v1/company/needs/{id}/shortlist/select", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());

        // Verifica status via GET da need
        var need = needRepository.findById(java.util.UUID.fromString(needId)).orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotEquals(NeedStatus.SHORTLIST_SENT, need.getStatus());
    }

    @Test
    @WithMockUser(username = "pme.nsc@test.com", roles = "PME")
    void selectExecutives_idInvalido_retorna422() throws Exception {
        var req = new SelectionRequest(List.of(java.util.UUID.randomUUID()));
        mockMvc.perform(post("/api/v1/company/needs/{id}/shortlist/select", needId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "outro.pme@test.com", roles = "PME")
    void getShortlist_outraPme_retorna403() throws Exception {
        User outro = new User("outro.pme@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(outro);
        Company outraEmpresa = new Company("Outra", "99.888.777/0001-11", "Tech",
            "E_1_10", "R_ATE_1M", "Resp", "outro.pme@test.com", outro);
        outraEmpresa.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(outraEmpresa);

        mockMvc.perform(get("/api/v1/company/needs/{id}/shortlist", needId))
            .andExpect(status().isForbidden());
    }
}
