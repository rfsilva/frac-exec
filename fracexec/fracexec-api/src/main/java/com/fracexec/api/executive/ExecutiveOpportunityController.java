package com.fracexec.api.executive;

import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.ExecutiveOpportunity;
import com.fracexec.api.match.ExecutiveOpportunityRepository;
import com.fracexec.api.match.OpportunityStatus;
import com.fracexec.api.match.dto.OpportunityResponse;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/executive/opportunities")
@PreAuthorize("hasRole('EXECUTIVE')")
public class ExecutiveOpportunityController {

    private static final Logger log = LoggerFactory.getLogger(ExecutiveOpportunityController.class);
    private static final List<OpportunityStatus> ACTIVE   = List.of(OpportunityStatus.AVAILABLE);
    private static final List<OpportunityStatus> HISTORY  = List.of(
        OpportunityStatus.INTERESTED, OpportunityStatus.DECLINED,
        OpportunityStatus.EXPIRED,    OpportunityStatus.RETRACTED
    );

    private final ExecutiveOpportunityRepository opportunityRepository;
    private final ExecutiveProfileRepository     profileRepository;
    private final UserRepository                 userRepository;
    private final com.fracexec.api.match.service.OpportunityExpirationJob expirationJob;

    public ExecutiveOpportunityController(ExecutiveOpportunityRepository opportunityRepository,
                                          ExecutiveProfileRepository profileRepository,
                                          UserRepository userRepository,
                                          com.fracexec.api.match.service.OpportunityExpirationJob expirationJob) {
        this.opportunityRepository = opportunityRepository;
        this.profileRepository     = profileRepository;
        this.userRepository        = userRepository;
        this.expirationJob         = expirationJob;
    }

    @GetMapping
    public Map<String, List<OpportunityResponse>> list(Authentication auth) {
        var profile = findProfile(auth);
        var active  = opportunityRepository.findAllByExecutiveProfileAndStatusIn(profile, ACTIVE)
            .stream().map(this::toResponse).toList();
        var history = opportunityRepository.findAllByExecutiveProfileAndStatusIn(profile, HISTORY)
            .stream().map(this::toResponse).toList();
        return Map.of("active", active, "history", history);
    }

    @PostMapping("/{id}/interest")
    public OpportunityResponse declareInterest(@PathVariable UUID id, Authentication auth) {
        var opp = findAndValidateOwnership(id, auth);
        if (opp.getStatus() != OpportunityStatus.AVAILABLE) {
            throw new BusinessRuleException("Esta oportunidade não está disponível para resposta.");
        }
        opp.setStatus(OpportunityStatus.INTERESTED);
        opp.setInterestedAt(Instant.now());
        opportunityRepository.save(opp);
        log.info("Executivo declarou interesse na oportunidade [{}]", id);
        return toResponse(opp);
    }

    @PostMapping("/{id}/decline")
    public OpportunityResponse decline(@PathVariable UUID id,
                                       @RequestBody(required = false) Map<String, String> body,
                                       Authentication auth) {
        var opp = findAndValidateOwnership(id, auth);
        if (opp.getStatus() != OpportunityStatus.AVAILABLE) {
            throw new BusinessRuleException("Esta oportunidade não está disponível para resposta.");
        }
        opp.setStatus(OpportunityStatus.DECLINED);
        opp.setDeclinedAt(Instant.now());
        if (body != null) opp.setDeclineReason(body.get("reason"));
        opportunityRepository.save(opp);
        expirationJob.checkBothDeclinedForNeed(opp);
        log.info("Executivo declinou oportunidade [{}]", id);
        return toResponse(opp);
    }

    @PostMapping("/{id}/retract")
    public OpportunityResponse retract(@PathVariable UUID id, Authentication auth) {
        var opp = findAndValidateOwnership(id, auth);
        if (!opp.canRetract()) {
            throw new BusinessRuleException("Retratação não disponível — prazo expirado ou contrato já gerado.");
        }
        opp.setStatus(OpportunityStatus.RETRACTED);
        opp.setRetractedAt(Instant.now());
        opportunityRepository.save(opp);
        log.info("Executivo retratou interesse na oportunidade [{}]", id);
        return toResponse(opp);
    }

    private ExecutiveOpportunity findAndValidateOwnership(UUID id, Authentication auth) {
        var opp = opportunityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Oportunidade não encontrada."));
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        var profile = profileRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));
        if (!opp.getExecutiveProfile().getId().equals(profile.getId())) {
            throw new com.fracexec.api.shared.exception.ForbiddenException("Esta oportunidade não pertence a você.");
        }
        return opp;
    }

    private com.fracexec.api.executive.model.ExecutiveProfile findProfile(Authentication auth) {
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return profileRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));
    }

    private OpportunityResponse toResponse(ExecutiveOpportunity o) {
        var need = o.getNeed();
        var summary = need.getChallengeDescription() != null
            ? need.getChallengeDescription().substring(0, Math.min(100, need.getChallengeDescription().length()))
            : "";
        return new OpportunityResponse(
            o.getId(), need.getId(), need.getCLevelType(),
            need.getScopeDaysPerMonth(), need.getEstimatedDuration(),
            summary, need.getCompany().getSector(),
            need.getCompany().getEmployeeRange(),
            o.getStatus().name(), o.getExpiresAt(), o.canRetract()
        );
    }
}
