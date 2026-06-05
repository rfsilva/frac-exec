package com.fracexec.api.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fracexec.api.company.*;
import com.fracexec.api.contract.dto.CreateContractRequest;
import com.fracexec.api.contract.dto.SignContractRequest;
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

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ContractControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired ExecutiveOpportunityRepository opportunityRepository;
    @Autowired ShortlistRepository shortlistRepository;
    @Autowired ShortlistExecutiveRepository shortlistExecutiveRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private String needId;
    private String profileId;

    @BeforeEach
    void setup() {
        // PME + empresa + necessidade IN_MEDIATION
        User pme = new User("pme.contract@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company company = new Company("Empresa Contrato", "11.222.333/0001-81",
            "Tecnologia", "E_11_50", "R_1M_5M", "Admin", "pme.contract@test.com", pme);
        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        Need need = new Need(company, "CFO", "3-4", "6 meses", LocalDate.now().plusMonths(1),
            "Desafio de reestruturação financeira para captar série A.",
            "Empresa pronta para captação.", null, NeedStatus.IN_MEDIATION);
        needRepository.save(need);
        needId = need.getId().toString();

        // Executivo com perfil + oportunidade INTERESTED
        User exec = new User("exec.contract@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio do executivo para contrato.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);
        profileId = profile.getId().toString();

        // Criar shortlist + shortlist_executive + oportunidade INTERESTED
        Shortlist shortlist = new Shortlist(need);
        shortlistRepository.save(shortlist);
        ShortlistExecutive slExec = new ShortlistExecutive(shortlist, profile, ConflictStatus.CLEAR);
        shortlistExecutiveRepository.save(slExec);

        ExecutiveOpportunity opp = new ExecutiveOpportunity(
            slExec, profile, need,
            java.time.Instant.now().plusSeconds(259200));
        opp.setStatus(OpportunityStatus.INTERESTED);
        opp.setInterestedAt(java.time.Instant.now());
        opportunityRepository.save(opp);
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void criarContrato_dadosValidos_retorna201() throws Exception {
        if (userRepository.findByEmail("admin@fracexec.com").isEmpty()) {
            userRepository.save(new User("admin@fracexec.com",
                passwordEncoder.encode("p"), Role.ADMIN));
        }

        var req = new CreateContractRequest(
            java.util.UUID.fromString(needId),
            java.util.UUID.fromString(profileId),
            new BigDecimal("15000.00"), 10, 6
        );
        mockMvc.perform(post("/api/v1/admin/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.companyName").value("Empresa Contrato"))
            .andExpect(jsonPath("$.fullySigned").value(false));
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void criarContrato_semInteressado_retorna422() throws Exception {
        if (userRepository.findByEmail("admin@fracexec.com").isEmpty()) {
            userRepository.save(new User("admin@fracexec.com",
                passwordEncoder.encode("p"), Role.ADMIN));
        }

        // Criar uma need sem executivo interessado
        Company company2 = companyRepository.findAll().get(0);
        Need need2 = new Need(company2, "CTO", "5-8", null, null,
            "Outro desafio para teste com necessidade sem executivo interessado.",
            "Resultado esperado.", null, NeedStatus.IN_MEDIATION);
        needRepository.save(need2);

        User exec2 = new User("exec2.contract@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec2);
        ExecutiveProfile profile2 = new ExecutiveProfile(exec2);
        profile2.setBio("Bio 2");
        profile2.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile2);

        var req = new CreateContractRequest(
            need2.getId(), profile2.getId(),
            new BigDecimal("10000.00"), 8, 3
        );
        mockMvc.perform(post("/api/v1/admin/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(username = "admin@fracexec.com", roles = "ADMIN")
    void assinarContrato_ambasParter_ativandoEngagement() throws Exception {
        if (userRepository.findByEmail("admin@fracexec.com").isEmpty()) {
            userRepository.save(new User("admin@fracexec.com",
                passwordEncoder.encode("p"), Role.ADMIN));
        }

        // Criar contrato
        var req = new CreateContractRequest(
            java.util.UUID.fromString(needId),
            java.util.UUID.fromString(profileId),
            new BigDecimal("12000.00"), 8, 6
        );
        var result = mockMvc.perform(post("/api/v1/admin/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn();
        var contractId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Assinar por ambas as partes
        mockMvc.perform(post("/api/v1/admin/contracts/{id}/sign", contractId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SignContractRequest(true, true))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fullySigned").value(true));

        // Verificar need CONTRACTED
        var need = needRepository.findById(java.util.UUID.fromString(needId)).orElseThrow();
        assert need.getStatus() == NeedStatus.CONTRACTED;
    }
}
