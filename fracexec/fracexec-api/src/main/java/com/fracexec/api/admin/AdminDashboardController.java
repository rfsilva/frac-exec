package com.fracexec.api.admin;

import com.fracexec.api.company.NeedRepository;
import com.fracexec.api.company.NeedStatus;
import com.fracexec.api.contract.*;
import com.fracexec.api.executive.repository.ExecutiveApplicationRepository;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private static final String KEY_ACTIVE = "active";

    private final ExecutiveApplicationRepository applicationRepository;
    private final ExecutiveProfileRepository     profileRepository;
    private final NeedRepository                 needRepository;
    private final ContractRepository             contractRepository;
    private final PaymentRepository              paymentRepository;

    public AdminDashboardController(ExecutiveApplicationRepository applicationRepository,
                                    ExecutiveProfileRepository profileRepository,
                                    NeedRepository needRepository,
                                    ContractRepository contractRepository,
                                    PaymentRepository paymentRepository) {
        this.applicationRepository = applicationRepository;
        this.profileRepository     = profileRepository;
        this.needRepository        = needRepository;
        this.contractRepository    = contractRepository;
        this.paymentRepository     = paymentRepository;
    }

    @GetMapping
    public Map<String, Object> getDashboard() {
        long pending      = applicationRepository.count();
        long poolActive   = profileRepository.findAll().stream()
            .filter(p -> "ACTIVE".equals(p.getProfileStatus().name())).count();

        long needsActive  = needRepository.findAll().stream()
            .filter(n -> n.getStatus() != NeedStatus.DRAFT && n.getStatus() != NeedStatus.CONTRACTED)
            .count();

        long contractsActive = contractRepository.findAll().stream()
            .filter(c -> c.isFullySigned()).count();

        var currentMonth = YearMonth.now(ZoneId.of("America/Sao_Paulo"));
        var allPayments  = paymentRepository.findAll();

        BigDecimal toReceive  = allPayments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.PENDING)
            .map(Payment::getGrossAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal inEscrow   = allPayments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.PAID)
            .map(Payment::getNetAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal transferred = allPayments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.TRANSFERRED && p.getTransferredAt() != null
                && YearMonth.from(p.getTransferredAt().atZone(ZoneId.of("America/Sao_Paulo"))).equals(currentMonth))
            .map(Payment::getNetAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "candidatures",    Map.of("total", pending),
            "pool",            Map.of(KEY_ACTIVE, poolActive),
            "needs",           Map.of(KEY_ACTIVE, needsActive),
            "contracts",       Map.of(KEY_ACTIVE, contractsActive),
            "paymentPipeline", Map.of("toReceive", toReceive, "inEscrow", inEscrow, "transferred", transferred),
            "lgpdPendingCount", 0L
        );
    }
}
