package com.fracexec.api.company;

import com.fracexec.api.match.ConflictStatus;
import com.fracexec.api.match.ExecutiveOpportunity;
import com.fracexec.api.match.ExecutiveOpportunityRepository;
import com.fracexec.api.match.Shortlist;
import com.fracexec.api.match.ShortlistRepository;
import com.fracexec.api.match.dto.AnonExecutiveProfile;
import com.fracexec.api.match.dto.SelectionRequest;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ForbiddenException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.util.BusinessDayCalculator;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/company/needs/{needId}")
@PreAuthorize("hasRole('PME')")
public class NeedShortlistController {

    private static final Logger log = LoggerFactory.getLogger(NeedShortlistController.class);

    private final NeedRepository                 needRepository;
    private final CompanyRepository              companyRepository;
    private final ShortlistRepository            shortlistRepository;
    private final ExecutiveOpportunityRepository opportunityRepository;
    private final UserRepository                 userRepository;
    private final EmailService                   emailService;

    public NeedShortlistController(NeedRepository needRepository,
                                   CompanyRepository companyRepository,
                                   ShortlistRepository shortlistRepository,
                                   ExecutiveOpportunityRepository opportunityRepository,
                                   UserRepository userRepository,
                                   EmailService emailService) {
        this.needRepository      = needRepository;
        this.companyRepository   = companyRepository;
        this.shortlistRepository = shortlistRepository;
        this.opportunityRepository = opportunityRepository;
        this.userRepository      = userRepository;
        this.emailService        = emailService;
    }

    @GetMapping("/shortlist")
    public List<AnonExecutiveProfile> getAnonProfiles(@PathVariable UUID needId,
                                                       Authentication auth) {
        Need need = findAndValidateNeed(needId, auth);
        if (need.getStatus() != NeedStatus.SHORTLIST_SENT) {
            throw new BusinessRuleException("Shortlist disponível apenas quando status for SHORTLIST_SENT.");
        }
        Shortlist shortlist = shortlistRepository.findByNeed(need)
            .orElseThrow(() -> new ResourceNotFoundException("Shortlist não encontrada."));

        return shortlist.getExecutives().stream()
            .filter(e -> e.getConflictStatus() != ConflictStatus.EXCLUDED)
            .map(e -> {
                var profile = e.getExecutiveProfile();
                var clevel  = profile.getSpecialties().isEmpty() ? "EX"
                    : profile.getSpecialties().get(0).getSpecialty().name().substring(0, 2);
                var sectors = profile.getSectors().stream()
                    .map(s -> s.getSectorName()).toList();
                var bio = profile.getBio() != null
                    ? profile.getBio().substring(0, Math.min(150, profile.getBio().length()))
                    : null;
                return new AnonExecutiveProfile(
                    e.getId(), clevel,
                    profile.getSpecialties().isEmpty() ? "N/A"
                        : profile.getSpecialties().get(0).getSpecialty().name(),
                    sectors, profile.getAvailabilityDaysPerMonth(),
                    bio, e.getConflictStatus().name()
                );
            }).toList();
    }

    @PostMapping("/shortlist/select")
    public void selectExecutives(@PathVariable UUID needId,
                                 @Valid @RequestBody SelectionRequest req,
                                 Authentication auth) {
        Need need = findAndValidateNeed(needId, auth);
        if (need.getStatus() != NeedStatus.SHORTLIST_SENT) {
            throw new BusinessRuleException("Seleção disponível apenas quando status for SHORTLIST_SENT.");
        }
        Shortlist shortlist = shortlistRepository.findByNeed(need)
            .orElseThrow(() -> new ResourceNotFoundException("Shortlist não encontrada."));

        // Validar que os IDs selecionados pertencem à shortlist
        var validIds = shortlist.getExecutives().stream()
            .map(e -> e.getId()).toList();
        for (UUID id : req.selectedExecutiveIds()) {
            if (!validIds.contains(id)) {
                throw new BusinessRuleException("Executivo [" + id + "] não pertence a esta shortlist.");
            }
        }

        need.setStatus(NeedStatus.IN_MEDIATION);
        needRepository.save(need);

        // Criar ExecutiveOpportunity e notificar executivos selecionados
        shortlist.getExecutives().stream()
            .filter(e -> req.selectedExecutiveIds().contains(e.getId()))
            .forEach(e -> {
                var expiresAt = BusinessDayCalculator.addBusinessDays(java.time.Instant.now(), 3);
                opportunityRepository.save(new ExecutiveOpportunity(e, e.getExecutiveProfile(), need, expiresAt));

                try {
                    String execEmail = e.getExecutiveProfile().getUser().getEmail();
                    String summary = need.getChallengeDescription().substring(0, Math.min(100, need.getChallengeDescription().length()));
                    emailService.sendOpportunityAvailable(execEmail,
                        need.getCLevelType(), need.getCompany().getSector(),
                        need.getCompany().getEmployeeRange(), need.getScopeDaysPerMonth(), summary
                    );
                } catch (Exception ex) {
                    log.warn("Falha ao enviar e-mail opportunity-available: {}", ex.getClass().getSimpleName());
                }
            });

        log.info("PME selecionou executivos para necessidade [{}]; status → IN_MEDIATION", needId);
    }

    private Need findAndValidateNeed(UUID needId, Authentication auth) {
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        var company = companyRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));
        var need = needRepository.findById(needId)
            .orElseThrow(() -> new ResourceNotFoundException("Necessidade não encontrada."));
        if (!need.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenException("Esta necessidade não pertence à sua empresa.");
        }
        return need;
    }
}
