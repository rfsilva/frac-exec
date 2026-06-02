package com.fracexec.api.executive.service;

import com.fracexec.api.executive.dto.ApplicationPositionDto;
import com.fracexec.api.executive.dto.ApplicationReferenceDto;
import com.fracexec.api.executive.dto.ApplicationRequest;
import com.fracexec.api.executive.dto.ApplicationResponse;
import com.fracexec.api.executive.model.ApplicationPosition;
import com.fracexec.api.executive.model.ApplicationReference;
import com.fracexec.api.executive.model.ApplicationStatus;
import com.fracexec.api.executive.model.ExecutiveApplication;
import com.fracexec.api.executive.repository.ExecutiveApplicationRepository;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.DuplicateResourceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class ExecutiveApplicationServiceImpl implements ExecutiveApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ExecutiveApplicationServiceImpl.class);

    private final ExecutiveApplicationRepository repository;
    private final EmailService emailService;

    public ExecutiveApplicationServiceImpl(ExecutiveApplicationRepository repository,
                                           EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    @Override
    public ApplicationResponse submit(ApplicationRequest request) {
        // AC-9: verificar candidatura duplicada em PENDING ou UNDER_REVIEW
        repository.findFirstByEmailAndStatusIn(
            request.email(),
            List.of(ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW)
        ).ifPresent(existing -> {
            throw new DuplicateResourceException("Você já possui uma candidatura em análise.");
        });

        // B2: ORDER BY garante o REJECTED mais recente; P2: data formatada em dd/MM/yyyy (consistente com e-mail)
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("America/Sao_Paulo"));
        repository.findLatestByEmailAndStatus(request.email(), ApplicationStatus.REJECTED)
            .ifPresent(rejected -> {
                if (rejected.getCanReapplyAfter() != null
                    && Instant.now().isBefore(rejected.getCanReapplyAfter())) {
                    throw new BusinessRuleException(
                        "Nova candidatura disponível a partir de " + fmt.format(rejected.getCanReapplyAfter()));
                }
            });

        ExecutiveApplication app = new ExecutiveApplication(
            request.fullName(),
            request.email(),
            request.linkedinUrl(),
            request.motivation(),
            request.lgpdConsent(),
            request.lgpdConsent() ? Instant.now() : null
        );

        int order = 0;
        for (ApplicationPositionDto pos : request.positions()) {
            app.addPosition(new ApplicationPosition(
                pos.roleTitle(), pos.companyName(),
                pos.periodStart(), pos.periodEnd(),
                pos.teamSize(), pos.revenueManaged(),
                order++
            ));
        }

        for (ApplicationReferenceDto ref : request.references()) {
            app.addReference(new ApplicationReference(
                ref.refName(), ref.refRole(), ref.refContact()
            ));
        }

        repository.save(app);

        // AC-8: apenas ID é logado — nunca nome, email ou dados pessoais
        log.info("Candidatura recebida ID [{}]", app.getId());

        // AC-7: disparar e-mail de confirmação (FR-1.3)
        emailService.sendApplicationReceived(request.email(), request.fullName());

        return new ApplicationResponse(app.getId(), app.getStatus(), app.getCreatedAt());
    }
}
