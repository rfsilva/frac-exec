package com.fracexec.api.admin.company;

import com.fracexec.api.company.Company;
import com.fracexec.api.company.CompanyRepository;
import com.fracexec.api.company.CompanyStatus;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.auth.model.PasswordResetToken;
import com.fracexec.api.shared.auth.repository.PasswordResetTokenRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/companies")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCompanyController {

    private static final Logger log = LoggerFactory.getLogger(AdminCompanyController.class);

    private final CompanyRepository            companyRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService                 emailService;

    @Value("${fracexec.app.base-url:${FRONTEND_URL:http://localhost:4200}}")
    private String appBaseUrl;

    public AdminCompanyController(CompanyRepository companyRepository,
                                   PasswordResetTokenRepository passwordResetTokenRepository,
                                   EmailService emailService) {
        this.companyRepository            = companyRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService                 = emailService;
    }

    @GetMapping
    public Page<AdminCompanySummaryResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // F01: paginação nativa via JPA — não carrega tudo em memória
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Company> companies = (status != null && !status.isBlank())
            ? companyRepository.findByStatus(parseStatus(status), pageable)
            : companyRepository.findAll(pageable);

        return companies.map(c -> new AdminCompanySummaryResponse(
            c.getId(), c.getLegalName(), c.getCnpj(),
            c.getResponsibleName(), c.getResponsibleEmail(),
            c.getStatus().name(), c.getCreatedAt()));
    }

    @PatchMapping("/{id}/activate")
    public AdminCompanySummaryResponse activate(@PathVariable UUID id) {
        Company company = companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));

        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        // F07: invalidar tokens anteriores antes de criar novo
        passwordResetTokenRepository.invalidatePriorTokensByUserId(company.getUser().getId());

        String rawToken = UUID.randomUUID().toString();
        passwordResetTokenRepository.save(new PasswordResetToken(
            company.getUser(), hashToken(rawToken),
            Instant.now().plus(1, ChronoUnit.HOURS)
        ));

        String firstAccessLink = appBaseUrl + "/reset-password?token=" + rawToken;
        try {
            emailService.sendCompanyActivated(
                company.getResponsibleEmail(), company.getLegalName(), firstAccessLink);
        } catch (Exception e) {
            // F02: log da falha de e-mail para rastreabilidade operacional
            log.warn("Falha ao enviar e-mail de ativação para empresa [{}]: {}",
                company.getId(), e.getClass().getSimpleName());
        }

        return new AdminCompanySummaryResponse(
            company.getId(), company.getLegalName(), company.getCnpj(),
            company.getResponsibleName(), company.getResponsibleEmail(),
            company.getStatus().name(), company.getCreatedAt());
    }

    private CompanyStatus parseStatus(String s) {
        try { return CompanyStatus.valueOf(s.toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new com.fracexec.api.shared.exception.InvalidRequestException("Status inválido: " + s);
        }
    }

    private String hashToken(String raw) {
        try {
            byte[] hash = java.security.MessageDigest.getInstance("SHA-256")
                .digest(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
