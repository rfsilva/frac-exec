package com.fracexec.api.match;

import com.fracexec.api.company.*;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.service.OpportunityExpirationJob;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OpportunityExpirationJobTest {

    @Autowired OpportunityExpirationJob expirationJob;
    @Autowired ExecutiveOpportunityRepository oppRepository;
    @Autowired ShortlistRepository shortlistRepository;
    @Autowired ShortlistExecutiveRepository slExecRepository;
    @Autowired NeedRepository needRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired jakarta.persistence.EntityManager em;

    private Need need;
    private ExecutiveProfile profile;

    @BeforeEach
    void setup() {
        User pme = new User("pme.oej@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company co = new Company("Empresa OEJ", "22.222.222/0001-22", "Tech",
            "E_11_50", "R_1M_5M", "R", "pme.oej@test.com", pme);
        co.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(co);

        need = new Need(co, "CFO", "3-4", null, LocalDate.now().plusMonths(1),
            "Desc OEJ.", "Res OEJ.", null, NeedStatus.IN_MEDIATION);
        needRepository.save(need);

        User exec = new User("exec.oej@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        profile = new ExecutiveProfile(exec);
        profile.setBio("Bio OEJ.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);
    }

    private Shortlist shortlist;

    private ExecutiveOpportunity createOpp(Instant expiresAt, OpportunityStatus status) {
        if (shortlist == null) {
            shortlist = new Shortlist(need);
            shortlistRepository.save(shortlist);
        }
        // Criar um novo perfil executivo para cada opp (evita conflito de user único)
        User execN = new User("exec.oej." + System.nanoTime() + "@test.com",
            passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(execN);
        ExecutiveProfile profN = new ExecutiveProfile(execN);
        profN.setBio("Bio OEJ " + System.nanoTime());
        profN.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profN);

        ShortlistExecutive slExec = new ShortlistExecutive(shortlist, profN, ConflictStatus.CLEAR);
        slExecRepository.save(slExec);
        ExecutiveOpportunity opp = new ExecutiveOpportunity(slExec, profN, need, expiresAt);
        opp.setStatus(status);
        oppRepository.save(opp);
        em.flush();
        em.clear();
        return opp;
    }

    @Test
    void expireOpportunities_expiraOppVencida() {
        var opp = createOpp(Instant.now().minusSeconds(3600), OpportunityStatus.AVAILABLE);

        expirationJob.expireOpportunities();

        em.flush(); em.clear();
        var updated = oppRepository.findById(opp.getId()).orElseThrow();
        assertEquals(OpportunityStatus.EXPIRED, updated.getStatus());
    }

    @Test
    void expireOpportunities_naoExpiraOppFutura() {
        var opp = createOpp(Instant.now().plusSeconds(3600 * 24), OpportunityStatus.AVAILABLE);

        expirationJob.expireOpportunities();

        em.flush(); em.clear();
        var updated = oppRepository.findById(opp.getId()).orElseThrow();
        assertEquals(OpportunityStatus.AVAILABLE, updated.getStatus());
    }

    @Test
    void checkBothDeclinedForNeed_todosDeclinados_mudaNeedParaUnderAnalysis() {
        var opp = createOpp(Instant.now().plusSeconds(3600), OpportunityStatus.DECLINED);

        expirationJob.checkBothDeclinedForNeed(
            oppRepository.findById(opp.getId()).orElseThrow());

        em.flush(); em.clear();
        var updated = needRepository.findById(need.getId()).orElseThrow();
        assertEquals(NeedStatus.UNDER_ANALYSIS, updated.getStatus());
    }

    @Test
    void checkBothDeclinedForNeed_algumDisponivel_naoMudaNeed() {
        createOpp(Instant.now().plusSeconds(3600), OpportunityStatus.AVAILABLE);
        var opp2 = createOpp(Instant.now().plusSeconds(3600), OpportunityStatus.DECLINED);

        expirationJob.checkBothDeclinedForNeed(
            oppRepository.findById(opp2.getId()).orElseThrow());

        em.flush(); em.clear();
        var updated = needRepository.findById(need.getId()).orElseThrow();
        assertEquals(NeedStatus.IN_MEDIATION, updated.getStatus());
    }
}
