package com.fracexec.api.executive;

import com.fracexec.api.contract.*;
import com.fracexec.api.contract.dto.PaymentResponse;
import com.fracexec.api.contract.service.PaymentService;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.util.BusinessDayCalculator;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/executive/payments")
@PreAuthorize("hasRole('EXECUTIVE')")
public class ExecutivePaymentController {

    private final PaymentService             paymentService;
    private final PaymentRepository          paymentRepository;
    private final EngagementRepository       engagementRepository;
    private final ExecutiveProfileRepository profileRepository;
    private final UserRepository             userRepository;

    public ExecutivePaymentController(PaymentService paymentService,
                                       PaymentRepository paymentRepository,
                                       EngagementRepository engagementRepository,
                                       ExecutiveProfileRepository profileRepository,
                                       UserRepository userRepository) {
        this.paymentService       = paymentService;
        this.paymentRepository    = paymentRepository;
        this.engagementRepository = engagementRepository;
        this.profileRepository    = profileRepository;
        this.userRepository       = userRepository;
    }

    @GetMapping
    public List<PaymentResponse> list(Authentication auth) {
        var profile = findProfile(auth);
        var engagements = engagementRepository.findAllByExecutiveProfile(profile);
        return paymentService.listByEngagements(engagements);
    }

    @GetMapping("/summary")
    public Map<String, Object> summary(Authentication auth) {
        var profile     = findProfile(auth);
        var engagements = engagementRepository.findAllByExecutiveProfile(profile);
        var payments    = paymentRepository.findAllByEngagementIn(engagements);

        // Próximo repasse pendente
        PaymentResponse next = payments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.PAID && p.getPaidAt() != null)
            .map(p -> paymentService.toResponse(p))
            .min((a, b) -> a.estimatedTransferAt().compareTo(b.estimatedTransferAt()))
            .orElse(null);

        // Total recebido no mês corrente
        var currentMonth = YearMonth.now(ZoneId.of("America/Sao_Paulo"));
        BigDecimal monthTotal = payments.stream()
            .filter(p -> p.getStatus() == PaymentStatus.TRANSFERRED && p.getTransferredAt() != null)
            .filter(p -> YearMonth.from(p.getTransferredAt().atZone(ZoneId.of("America/Sao_Paulo")))
                .equals(currentMonth))
            .map(Payment::getNetAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "nextTransfer", next != null ? next : Map.of(),
            "monthTotal", monthTotal
        );
    }

    private com.fracexec.api.executive.model.ExecutiveProfile findProfile(Authentication auth) {
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return profileRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));
    }
}
