package com.fracexec.api.executive;

import com.fracexec.api.contract.EngagementRepository;
import com.fracexec.api.contract.EngagementStatus;
import com.fracexec.api.contract.PaymentRepository;
import com.fracexec.api.contract.PaymentStatus;
import com.fracexec.api.executive.dto.ExecutiveDashboardResponse;
import com.fracexec.api.executive.dto.ExecutiveDashboardResponse.EngagementSummary;
import com.fracexec.api.executive.dto.ExecutiveDashboardResponse.OpportunityPreview;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.ExecutiveOpportunityRepository;
import com.fracexec.api.match.OpportunityStatus;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/executive/dashboard")
@PreAuthorize("hasRole('EXECUTIVE')")
public class ExecutiveDashboardController {

    private final EngagementRepository       engagementRepository;
    private final PaymentRepository          paymentRepository;
    private final ExecutiveOpportunityRepository opportunityRepository;
    private final ExecutiveProfileRepository profileRepository;
    private final UserRepository             userRepository;

    public ExecutiveDashboardController(EngagementRepository engagementRepository,
                                        PaymentRepository paymentRepository,
                                        ExecutiveOpportunityRepository opportunityRepository,
                                        ExecutiveProfileRepository profileRepository,
                                        UserRepository userRepository) {
        this.engagementRepository  = engagementRepository;
        this.paymentRepository     = paymentRepository;
        this.opportunityRepository = opportunityRepository;
        this.profileRepository     = profileRepository;
        this.userRepository        = userRepository;
    }

    @GetMapping
    public ExecutiveDashboardResponse getDashboard(Authentication auth) {
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        var profile = profileRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));

        var activeEngagements = engagementRepository
            .findAllByExecutiveProfileAndStatus(profile, EngagementStatus.ACTIVE);

        int committedDays = activeEngagements.stream()
            .mapToInt(e -> e.getScopeDaysPerMonth() != null ? e.getScopeDaysPerMonth() : 0)
            .sum();

        var pendingPayments = paymentRepository.findAllByEngagementIn(activeEngagements).stream()
            .filter(p -> p.getStatus() == PaymentStatus.PAID)
            .toList();
        BigDecimal nextTransfer = pendingPayments.isEmpty() ? BigDecimal.ZERO
            : pendingPayments.get(0).getNetAmount();

        var pendingOpps = opportunityRepository
            .findAllByExecutiveProfileAndStatusIn(profile, List.of(OpportunityStatus.AVAILABLE));

        var summaries = activeEngagements.stream().map(e -> new EngagementSummary(
            e.getId(),
            e.getNeed().getCompany().getLegalName(),
            e.getNeed().getCLevelType(),
            e.getScopeDaysPerMonth() != null ? e.getScopeDaysPerMonth() : 0,
            e.getStatus().name()
        )).toList();

        OpportunityPreview preview = pendingOpps.isEmpty() ? null
            : new OpportunityPreview(
                pendingOpps.get(0).getId(),
                pendingOpps.get(0).getNeed().getCLevelType(),
                pendingOpps.get(0).getNeed().getCompany().getSector(),
                pendingOpps.get(0).getStatus().name()
            );

        return new ExecutiveDashboardResponse(
            activeEngagements.size(), committedDays,
            nextTransfer, pendingOpps.size(), summaries, preview
        );
    }
}
