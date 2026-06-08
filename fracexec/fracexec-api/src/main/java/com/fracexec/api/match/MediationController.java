package com.fracexec.api.match;

import com.fracexec.api.company.CompanyRepository;
import com.fracexec.api.company.NeedRepository;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.dto.MediationMessageResponse;
import com.fracexec.api.match.dto.SendMessageRequest;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ForbiddenException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class MediationController {

    private static final Logger log = LoggerFactory.getLogger(MediationController.class);

    private final MediationMessageRepository messageRepository;
    private final NeedRepository             needRepository;
    private final CompanyRepository          companyRepository;
    private final ExecutiveProfileRepository profileRepository;
    private final UserRepository             userRepository;
    private final EmailService               emailService;

    public MediationController(MediationMessageRepository messageRepository,
                               NeedRepository needRepository,
                               CompanyRepository companyRepository,
                               ExecutiveProfileRepository profileRepository,
                               UserRepository userRepository,
                               EmailService emailService) {
        this.messageRepository = messageRepository;
        this.needRepository    = needRepository;
        this.companyRepository = companyRepository;
        this.profileRepository = profileRepository;
        this.userRepository    = userRepository;
        this.emailService      = emailService;
    }

    // ── ADMIN ────────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/admin/needs/{needId}/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public List<MediationMessageResponse> adminGetMessages(@PathVariable UUID needId) {
        var need = findNeed(needId);
        return messageRepository.findAllByNeedOrderByCreatedAtAsc(need)
            .stream().map(m -> toResponse(m, true)).toList();
    }

    @PostMapping("/api/v1/admin/needs/{needId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public MediationMessageResponse adminPostMessage(@PathVariable UUID needId,
                                                     @Valid @RequestBody SendMessageRequest req,
                                                     Authentication auth) {
        var need   = findNeed(needId);
        var adminId = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado.")).getId();
        var msg = new MediationMessage(need, SenderRole.ADMIN, adminId, req.content());
        messageRepository.save(msg);

        // Notificar PME e executivos (simplificado — PME recebe e-mail)
        try {
            String preview = req.content().substring(0, Math.min(100, req.content().length()));
            emailService.sendNewMediationMessage(
                need.getCompany().getResponsibleEmail(), "FracExec", preview);
        } catch (Exception e) {
            log.warn("Falha ao enviar notificação de mensagem: {}", e.getClass().getSimpleName());
        }
        return toResponse(msg, true);
    }

    // ── PME ──────────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/company/needs/{needId}/messages")
    @PreAuthorize("hasRole('PME')")
    public List<MediationMessageResponse> pmeGetMessages(@PathVariable UUID needId,
                                                          Authentication auth) {
        var need = findNeed(needId);
        validatePmeOwnership(needId, auth);
        return messageRepository.findAllByNeedOrderByCreatedAtAsc(need)
            .stream().map(m -> toResponse(m, false)).toList();
    }

    @PostMapping("/api/v1/company/needs/{needId}/contact-admin")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PME')")
    public void pmeContactAdmin(@PathVariable UUID needId,
                                @Valid @RequestBody SendMessageRequest req,
                                Authentication auth) {
        validatePmeOwnership(needId, auth);
        log.info("PME enviou mensagem ao FracExec para necessidade [{}]: {}...",
            needId, req.content().substring(0, Math.min(50, req.content().length())));
    }

    // ── EXECUTIVE ────────────────────────────────────────────────────────────

    @GetMapping("/api/v1/executive/needs/{needId}/messages")
    @PreAuthorize("hasRole('EXECUTIVE')")
    public List<MediationMessageResponse> execGetMessages(@PathVariable UUID needId) {
        var need = findNeed(needId);
        return messageRepository.findAllByNeedOrderByCreatedAtAsc(need)
            .stream().map(m -> toResponse(m, false)).toList();
    }

    @PostMapping("/api/v1/executive/needs/{needId}/contact-admin")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('EXECUTIVE')")
    public void execContactAdmin(@PathVariable UUID needId,
                                 @Valid @RequestBody SendMessageRequest req,
                                 Authentication auth) {
        findNeed(needId);
        log.info("Executivo [{}] enviou mensagem ao FracExec para necessidade [{}]",
            auth.getName(), needId);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private com.fracexec.api.company.Need findNeed(UUID needId) {
        return needRepository.findById(needId)
            .orElseThrow(() -> new ResourceNotFoundException("Necessidade não encontrada."));
    }

    private void validatePmeOwnership(UUID needId, Authentication auth) {
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        var company = companyRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));
        var need = findNeed(needId);
        if (!need.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenException("Esta necessidade não pertence à sua empresa.");
        }
    }

    private MediationMessageResponse toResponse(MediationMessage m, boolean includeAdminData) {
        String label = switch (m.getSenderRole()) {
            case ADMIN     -> "FracExec";
            case PME       -> "Empresa";
            case EXECUTIVE -> "Executivo";
        };
        return new MediationMessageResponse(
            m.getId(), m.getSenderRole().name(), label,
            m.getContent(), m.getCreatedAt(),
            includeAdminData ? m.getSenderId() : null
        );
    }
}
