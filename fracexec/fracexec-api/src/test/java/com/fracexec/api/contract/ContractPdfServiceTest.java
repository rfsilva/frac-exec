package com.fracexec.api.contract;

import com.fracexec.api.company.*;
import com.fracexec.api.contract.service.ContractPdfService;
import com.fracexec.api.executive.model.ExecutiveProfile;
import com.fracexec.api.executive.model.ProfileStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ContractPdfServiceTest {

    @Autowired ContractPdfService pdfService;
    @Autowired UserRepository userRepository;
    @Autowired CompanyRepository companyRepository;
    @Autowired NeedRepository needRepository;
    @Autowired ExecutiveProfileRepository profileRepository;
    @Autowired EngagementRepository engagementRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Contract buildContract() {
        User pme = new User("pme.pdf@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme);
        Company co = new Company("Empresa PDF", "66.666.666/0001-66", "Tech",
            "E_11_50", "R_1M_5M", "Resp", "pme.pdf@test.com", pme);
        co.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(co);

        Need need = new Need(co, "CFO", "3-4", "6 meses",
            LocalDate.now().plusMonths(1),
            "Desafio de reestruturação financeira para captação de série A.",
            "Empresa pronta para captação.", null, NeedStatus.CONTRACTED);
        needRepository.save(need);

        User exec = new User("exec.pdf@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec);
        ExecutiveProfile profile = new ExecutiveProfile(exec);
        profile.setBio("Bio PDF.");
        profile.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile);

        Engagement eng = new Engagement(need, profile, new BigDecimal("12000.00"), 8, 6);
        eng.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng);

        return new Contract(eng, "contracts/pdf-test.pdf",
            new BigDecimal("12000.00"), 8, 6);
    }

    @Test
    void generate_contratoValido_retornaByteArrayNaoVazio() throws Exception {
        var contract = buildContract();
        byte[] pdf = pdfService.generate(contract);
        assertNotNull(pdf);
        assertTrue(pdf.length > 100, "PDF deve ter conteúdo");
        // PDFs começam com %PDF
        assertEquals('%', (char) pdf[0]);
        assertEquals('P', (char) pdf[1]);
        assertEquals('D', (char) pdf[2]);
        assertEquals('F', (char) pdf[3]);
    }

    @Test
    void generate_semCamposOpcionais_naoLancaExcecao() throws Exception {
        User pme2 = new User("pme.pdf2@test.com", passwordEncoder.encode("p"), Role.PME);
        userRepository.save(pme2);
        Company co2 = new Company("Empresa PDF2", "77.777.777/0001-77", "Saúde",
            "E_1_10", "R_ATE_1M", "Resp", "pme.pdf2@test.com", pme2);
        co2.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(co2);

        // Need com campos opcionais nulos (scopeDays, duration, monthlyValue null)
        Need need2 = new Need(co2, "CTO", "5-8", null, null,
            "Desafio tecnológico sem prazo definido e sem valor mensal.",
            "Modernização completa.", null, NeedStatus.CONTRACTED);
        needRepository.save(need2);

        User exec2 = new User("exec.pdf2@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(exec2);
        ExecutiveProfile profile2 = new ExecutiveProfile(exec2);
        profile2.setBio("Bio PDF2.");
        profile2.setProfileStatus(ProfileStatus.ACTIVE);
        profileRepository.save(profile2);

        Engagement eng2 = new Engagement(need2, profile2, null, null, null);
        eng2.setStatus(EngagementStatus.ACTIVE);
        engagementRepository.save(eng2);

        var contract2 = new Contract(eng2, "contracts/pdf-test2.pdf", null, null, null);
        byte[] pdf = pdfService.generate(contract2);
        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }
}
