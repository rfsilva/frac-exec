package com.fracexec.api.account;

import com.fracexec.api.contract.EngagementRepository;
import com.fracexec.api.contract.EngagementStatus;
import com.fracexec.api.contract.PaymentRepository;
import com.fracexec.api.contract.PaymentStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/account")
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);

    private final DeletionRequestRepository deletionRepository;
    private final UserRepository            userRepository;
    private final EngagementRepository      engagementRepository;
    private final PaymentRepository         paymentRepository;
    private final ExecutiveProfileRepository profileRepository;
    private final EmailService              emailService;

    public AccountController(DeletionRequestRepository deletionRepository,
                              UserRepository userRepository,
                              EngagementRepository engagementRepository,
                              PaymentRepository paymentRepository,
                              ExecutiveProfileRepository profileRepository,
                              EmailService emailService) {
        this.deletionRepository = deletionRepository;
        this.userRepository     = userRepository;
        this.engagementRepository = engagementRepository;
        this.paymentRepository  = paymentRepository;
        this.profileRepository  = profileRepository;
        this.emailService       = emailService;
    }

    @PostMapping("/deletion-request")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> requestDeletion(Authentication auth) {
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        // Verificar engajamentos ACTIVE ou pagamentos PAID em escrow
        boolean hasActiveEngagements = false;
        var profile = profileRepository.findByUser(user).orElse(null);
        if (profile != null) {
            hasActiveEngagements = !engagementRepository
                .findAllByExecutiveProfileAndStatus(profile, EngagementStatus.ACTIVE).isEmpty();
        }
        boolean hasPendingPayments = !paymentRepository.findAll().stream()
            .filter(p -> p.getEngagement().getExecutiveProfile().equals(profile)
                && p.getStatus() == PaymentStatus.PAID)
            .toList().isEmpty();

        DeletionStatus status = (hasActiveEngagements || hasPendingPayments)
            ? DeletionStatus.PENDING_ENGAGEMENTS : DeletionStatus.PENDING;

        Instant processAfter = Instant.now().plus(30, ChronoUnit.DAYS);
        var request = new DeletionRequest(user, processAfter, status);
        deletionRepository.save(request);

        log.info("Solicitação de exclusão criada para user ID [{}] com status [{}]",
            user.getId(), status);

        try {
            emailService.sendDeletionRequestConfirmation(user.getEmail());
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail de confirmação de exclusão: {}", e.getClass().getSimpleName());
        }

        String message = status == DeletionStatus.PENDING_ENGAGEMENTS
            ? "Solicitação recebida. A exclusão será processada após a conclusão dos seus engajamentos ativos."
            : "Solicitação recebida. Seus dados serão anonimizados em até 30 dias.";

        return Map.of("message", message, "status", status.name());
    }
}
