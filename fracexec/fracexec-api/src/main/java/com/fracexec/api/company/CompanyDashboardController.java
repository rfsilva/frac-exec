package com.fracexec.api.company;

import com.fracexec.api.company.dto.CompanyDashboardResponse;
import com.fracexec.api.company.dto.NeedResponse;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.util.BusinessDayCalculator;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/company/dashboard")
@PreAuthorize("hasRole('PME')")
public class CompanyDashboardController {

    private static final List<NeedStatus> ACTIVE_STATUSES = List.of(
        NeedStatus.RECEIVED, NeedStatus.UNDER_ANALYSIS,
        NeedStatus.SHORTLIST_SENT, NeedStatus.IN_MEDIATION, NeedStatus.CONTRACTED
    );

    private final CompanyRepository companyRepository;
    private final NeedRepository    needRepository;
    private final UserRepository    userRepository;

    public CompanyDashboardController(CompanyRepository companyRepository,
                                      NeedRepository needRepository,
                                      UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.needRepository    = needRepository;
        this.userRepository    = userRepository;
    }

    @GetMapping
    public CompanyDashboardResponse getDashboard(Authentication auth) {
        var found   = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        Company company = companyRepository.findByUser(found)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));

        NeedResponse activeNeed = needRepository
            .findTopByCompanyAndStatusInOrderByCreatedAtDesc(company, ACTIVE_STATUSES)
            .map(n -> {
                Instant sla = BusinessDayCalculator.addBusinessDays(n.getCreatedAt(), 5);
                return new NeedResponse(
                    n.getId(), n.getCLevelType(), n.getScopeDaysPerMonth(),
                    n.getEstimatedDuration(), n.getDesiredStart(),
                    n.getChallengeDescription(), n.getExpectedResult(),
                    n.getStatus().name(), n.getCreatedAt(), sla
                );
            })
            .orElse(null);

        return new CompanyDashboardResponse(
            company.getLegalName(), company.getStatus().name(), activeNeed
        );
    }
}
