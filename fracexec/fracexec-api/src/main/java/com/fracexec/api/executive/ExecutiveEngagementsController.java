package com.fracexec.api.executive;

import com.fracexec.api.contract.Engagement;
import com.fracexec.api.contract.EngagementRepository;
import com.fracexec.api.contract.EngagementStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.InvalidRequestException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/executive/engagements")
@PreAuthorize("hasRole('EXECUTIVE')")
public class ExecutiveEngagementsController {

    private final EngagementRepository       engagementRepository;
    private final ExecutiveProfileRepository profileRepository;
    private final UserRepository             userRepository;

    public ExecutiveEngagementsController(EngagementRepository engagementRepository,
                                          ExecutiveProfileRepository profileRepository,
                                          UserRepository userRepository) {
        this.engagementRepository = engagementRepository;
        this.profileRepository    = profileRepository;
        this.userRepository       = userRepository;
    }

    record EngagementResponse(UUID id, String companyName, String cLevelType,
        int scopeDaysPerMonth, BigDecimal monthlyValue, String status, Instant startedAt) {}

    @GetMapping
    public List<EngagementResponse> list(@RequestParam(required = false) String status,
                                          Authentication auth) {
        var user    = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        var profile = profileRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));

        var all = status != null && !status.isBlank()
            ? engagementRepository.findAllByExecutiveProfileAndStatus(profile, parseStatus(status))
            : engagementRepository.findAllByExecutiveProfile(profile);

        return all.stream().map(e -> new EngagementResponse(
            e.getId(), e.getNeed().getCompany().getLegalName(),
            e.getNeed().getCLevelType(),
            e.getScopeDaysPerMonth() != null ? e.getScopeDaysPerMonth() : 0,
            e.getMonthlyValue(), e.getStatus().name(), e.getStartedAt()
        )).toList();
    }

    private EngagementStatus parseStatus(String s) {
        try { return EngagementStatus.valueOf(s.toUpperCase()); }
        catch (IllegalArgumentException e) { throw new InvalidRequestException("Status inválido: " + s); }
    }
}
