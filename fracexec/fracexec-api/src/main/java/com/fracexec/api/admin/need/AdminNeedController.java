package com.fracexec.api.admin.need;

import com.fracexec.api.company.Need;
import com.fracexec.api.company.NeedRepository;
import com.fracexec.api.company.NeedStatus;
import com.fracexec.api.shared.exception.InvalidRequestException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/needs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNeedController {

    private final NeedRepository needRepository;

    public AdminNeedController(NeedRepository needRepository) {
        this.needRepository = needRepository;
    }

    @GetMapping
    public Page<AdminNeedSummaryResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cLevelType,
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        NeedStatus parsedStatus = null;
        if (status != null && !status.isBlank()) {
            try { parsedStatus = NeedStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException e) { throw new InvalidRequestException("Status inválido: " + status); }
        }
        Instant from = dateFrom != null ? dateFrom.atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;
        Instant to   = dateTo   != null ? dateTo.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).toInstant() : null;

        return needRepository.findWithFilters(
            parsedStatus != null, parsedStatus,
            cLevelType   != null && !cLevelType.isBlank(), cLevelType,
            sector       != null && !sector.isBlank(), sector,
            from != null, from,
            to   != null, to,
            PageRequest.of(page, size, Sort.by("createdAt").descending())
        ).map(n -> new AdminNeedSummaryResponse(
            n.getId(), n.getCompany().getLegalName(),
            n.getCLevelType(), n.getScopeDaysPerMonth(),
            n.getEstimatedDuration(), n.getStatus().name(), n.getCreatedAt()
        ));
    }

    @GetMapping("/{id}")
    public AdminNeedDetailResponse detail(@PathVariable UUID id) {
        Need n = needRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Necessidade não encontrada."));
        return new AdminNeedDetailResponse(
            n.getId(), n.getCompany().getLegalName(), n.getCompany().getCnpj(),
            n.getCLevelType(), n.getScopeDaysPerMonth(), n.getEstimatedDuration(),
            n.getDesiredStart(), n.getChallengeDescription(), n.getExpectedResult(),
            n.getConfidentialContext(), n.getStatus().name(),
            n.getCreatedAt(), n.getUpdatedAt()
        );
    }

    @PatchMapping("/{id}/status")
    public AdminNeedSummaryResponse updateStatus(@PathVariable UUID id,
                                                  @Valid @RequestBody AdminNeedStatusRequest req) {
        Need n = needRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Necessidade não encontrada."));
        try {
            n.setStatus(NeedStatus.valueOf(req.status().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new InvalidRequestException("Status inválido: " + req.status());
        }
        needRepository.save(n);
        return new AdminNeedSummaryResponse(
            n.getId(), n.getCompany().getLegalName(),
            n.getCLevelType(), n.getScopeDaysPerMonth(),
            n.getEstimatedDuration(), n.getStatus().name(), n.getCreatedAt()
        );
    }
}
