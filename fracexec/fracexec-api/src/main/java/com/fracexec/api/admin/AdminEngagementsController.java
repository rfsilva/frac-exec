package com.fracexec.api.admin;

import com.fracexec.api.contract.Engagement;
import com.fracexec.api.contract.EngagementRepository;
import com.fracexec.api.contract.EngagementStatus;
import com.fracexec.api.shared.exception.InvalidRequestException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/engagements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEngagementsController {

    private final EngagementRepository engagementRepository;

    public AdminEngagementsController(EngagementRepository engagementRepository) {
        this.engagementRepository = engagementRepository;
    }

    record EngagementSummary(UUID id, String companyName, String executiveEmail,
        String cLevelType, BigDecimal monthlyValue, String status, Instant startedAt) {}

    record UpdateStatusRequest(@NotBlank String status, String reason) {}

    @GetMapping
    public List<EngagementSummary> list() {
        return engagementRepository.findAll().stream()
            .map(e -> new EngagementSummary(
                e.getId(),
                e.getNeed().getCompany().getLegalName(),
                e.getExecutiveProfile().getUser() != null ? e.getExecutiveProfile().getUser().getEmail() : "N/A",
                e.getNeed().getCLevelType(),
                e.getMonthlyValue(),
                e.getStatus().name(),
                e.getStartedAt()
            )).toList();
    }

    @PatchMapping("/{id}/status")
    public EngagementSummary updateStatus(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateStatusRequest req) {
        var engagement = engagementRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Engajamento não encontrado."));

        EngagementStatus newStatus;
        try { newStatus = EngagementStatus.valueOf(req.status().toUpperCase()); }
        catch (IllegalArgumentException e) { throw new InvalidRequestException("Status inválido: " + req.status()); }

        engagement.setStatus(newStatus);
        if (req.reason() != null && !req.reason().isBlank()) {
            engagement.setStatusReason(req.reason());
        }
        engagement.setStatusUpdatedAt(Instant.now());
        engagementRepository.save(engagement);

        return new EngagementSummary(
            engagement.getId(),
            engagement.getNeed().getCompany().getLegalName(),
            engagement.getExecutiveProfile().getUser() != null ? engagement.getExecutiveProfile().getUser().getEmail() : "N/A",
            engagement.getNeed().getCLevelType(),
            engagement.getMonthlyValue(),
            engagement.getStatus().name(),
            engagement.getStartedAt()
        );
    }
}
