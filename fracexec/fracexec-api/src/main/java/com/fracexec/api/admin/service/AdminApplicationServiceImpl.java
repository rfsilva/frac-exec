package com.fracexec.api.admin.service;

import com.fracexec.api.admin.dto.AdminApplicationDetailResponse;
import com.fracexec.api.admin.dto.DocumentUrlResponse;
import com.fracexec.api.executive.dto.ApplicationDetailResponse;
import com.fracexec.api.executive.dto.ApplicationSummaryResponse;
import com.fracexec.api.executive.dto.RejectRequest;
import com.fracexec.api.executive.dto.UpdateNotesRequest;
import com.fracexec.api.executive.dto.UpdateStatusRequest;
import com.fracexec.api.executive.model.ApplicationStatus;
import com.fracexec.api.executive.model.ExecutiveApplication;
import com.fracexec.api.executive.repository.ExecutiveApplicationRepository;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.storage.MinioStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AdminApplicationServiceImpl implements AdminApplicationService {

    private static final Logger log = LoggerFactory.getLogger(AdminApplicationServiceImpl.class);

    private static final Map<ApplicationStatus, Set<ApplicationStatus>> ALLOWED_TRANSITIONS;
    static {
        Map<ApplicationStatus, Set<ApplicationStatus>> m = new EnumMap<>(ApplicationStatus.class);
        m.put(ApplicationStatus.PENDING,      Set.of(ApplicationStatus.UNDER_REVIEW));
        m.put(ApplicationStatus.UNDER_REVIEW, Set.of(ApplicationStatus.APPROVED, ApplicationStatus.REJECTED));
        ALLOWED_TRANSITIONS = m;
    }

    private final ExecutiveApplicationRepository repository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final MinioStorageService minioStorageService;
    private final S3Client s3Client;

    @Value("${fracexec.app.base-url:${FRONTEND_URL:http://localhost:4200}}")
    private String appBaseUrl;

    public AdminApplicationServiceImpl(
            ExecutiveApplicationRepository repository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            MinioStorageService minioStorageService,
            S3Client s3Client) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.minioStorageService = minioStorageService;
        this.s3Client = s3Client;
    }

    @Override
    public Page<ApplicationSummaryResponse> listApplications(
            ApplicationStatus status, String name, Instant dateFrom, Instant dateTo, Pageable pageable) {
        String safeName = name != null ? escapeLikePattern(name) : null;
        return repository.findWithFilters(status, safeName, dateFrom, dateTo, pageable)
            .map(a -> new ApplicationSummaryResponse(
                a.getId(), a.getFullName(), a.getEmail(), a.getStatus(), a.getCreatedAt()));
    }

    @Override
    public ApplicationDetailResponse getApplication(UUID id) {
        return toDetailResponse(findById(id));
    }

    @Override
    public AdminApplicationDetailResponse getApplicationAdmin(UUID id) {
        ExecutiveApplication app = findById(id);
        String docUrl = null;
        if (app.getSupportDocumentKey() != null) {
            docUrl = minioStorageService.generatePresignedDownloadUrl(
                minioStorageService.getDocsBucket(),
                app.getSupportDocumentKey(),
                Duration.ofHours(1));
        }
        return new AdminApplicationDetailResponse(
            app.getId(), app.getFullName(), app.getEmail(), app.getLinkedinUrl(),
            app.getMotivation(), app.getStatus(), app.getCreatedAt(),
            app.getAdminNotes(), docUrl,
            app.getRejectionReason(), app.getCanReapplyAfter(),   // P4
            app.getPositions().stream().map(p -> new ApplicationDetailResponse.PositionDetail(
                p.getRoleTitle(), p.getCompanyName(), p.getPeriodStart(), p.getPeriodEnd(),
                p.getTeamSize(), p.getRevenueManaged())).toList(),
            app.getReferences().stream().map(r -> new ApplicationDetailResponse.ReferenceDetail(
                r.getRefName(), r.getRefRole(), r.getRefContact())).toList());
    }

    @Override
    @Transactional
    public ApplicationSummaryResponse updateStatus(UUID id, UpdateStatusRequest request) {
        ExecutiveApplication app = findById(id);
        Set<ApplicationStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(app.getStatus(), Set.of());
        if (!allowed.contains(request.status())) {
            throw new BusinessRuleException("Transição inválida: " + app.getStatus() + " → " + request.status());
        }
        app.setStatus(request.status());
        repository.save(app);
        return toSummary(app);
    }

    @Override
    @Transactional
    public void updateNotes(UUID id, UpdateNotesRequest request) {
        // P3: retorna void (204) — evita S3 presign desnecessário; front-end descarta a resposta
        ExecutiveApplication app = findById(id);
        app.setAdminNotes(request.adminNotes());
        repository.save(app);
    }

    @Override
    @Transactional
    public DocumentUrlResponse uploadDocument(UUID id, MultipartFile file) {
        ExecutiveApplication app = findById(id);
        // P1: UUID-based key — elimina path-traversal e colisão de nomes
        String ext       = extractExtension(file.getOriginalFilename());
        String objectKey = "applications/" + id + "/" + UUID.randomUUID() + ext;

        try {
            PutObjectRequest putReq = PutObjectRequest.builder()
                .bucket(minioStorageService.getDocsBucket())
                .key(objectKey)
                .contentType(file.getContentType())
                .build();
            s3Client.putObject(putReq, RequestBody.fromInputStream(
                file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            throw new BusinessRuleException("Falha ao fazer upload do documento.");
        }

        app.setSupportDocumentKey(objectKey);
        repository.save(app);
        log.info("Documento carregado para candidatura ID [{}]", id);

        String url = minioStorageService.generatePresignedDownloadUrl(
            minioStorageService.getDocsBucket(), objectKey, Duration.ofHours(1));
        return new DocumentUrlResponse(url);
    }

    @Override
    public DocumentUrlResponse getDocumentUrl(UUID id) {
        ExecutiveApplication app = findById(id);
        if (app.getSupportDocumentKey() == null) {
            throw new ResourceNotFoundException("Nenhum documento encontrado para esta candidatura.");
        }
        String url = minioStorageService.generatePresignedDownloadUrl(
            minioStorageService.getDocsBucket(), app.getSupportDocumentKey(), Duration.ofHours(1));
        return new DocumentUrlResponse(url);
    }

    @Override
    @Transactional
    public ApplicationSummaryResponse approve(UUID id) {
        ExecutiveApplication app = findById(id);
        if (app.getStatus() != ApplicationStatus.UNDER_REVIEW) {
            throw new BusinessRuleException(
                "Apenas candidaturas Em análise podem ser aprovadas. Status atual: " + app.getStatus());
        }

        // B1: guard idempotente — User pode já existir se admin aprovou duas vezes (evita DataIntegrityViolationException)
        User executive = userRepository.findByEmail(app.getEmail()).orElseGet(() -> {
            String tempPassword = UUID.randomUUID().toString();
            User u = new User(app.getEmail(), passwordEncoder.encode(tempPassword), Role.EXECUTIVE);
            return userRepository.save(u);
        });

        app.setUser(executive);
        app.setStatus(ApplicationStatus.APPROVED);
        repository.save(app);

        log.info("Candidatura ID [{}] aprovada; usuário EXECUTIVE criado ID [{}]", id, executive.getId());

        String profileLink = appBaseUrl + "/executive/profile";
        emailService.sendApplicationApproved(app.getEmail(), app.getFullName(), profileLink);

        return toSummary(app);
    }

    @Override
    @Transactional
    public ApplicationSummaryResponse reject(UUID id, RejectRequest request) {
        ExecutiveApplication app = findById(id);
        if (app.getStatus() != ApplicationStatus.UNDER_REVIEW) {
            throw new BusinessRuleException(
                "Apenas candidaturas Em análise podem ser rejeitadas. Status atual: " + app.getStatus());
        }

        app.setRejectionReason(request.rejectionReason());
        app.setStatus(ApplicationStatus.REJECTED);
        // FR-1.7: nova candidatura disponível após 6 meses (fallback para now() em testes H2)
        Instant base = app.getCreatedAt() != null ? app.getCreatedAt() : Instant.now();
        app.setCanReapplyAfter(base.plus(180, ChronoUnit.DAYS));
        repository.save(app);

        log.info("Candidatura ID [{}] rejeitada", id);

        emailService.sendApplicationRejected(app.getEmail(), app.getFullName(), app.getCanReapplyAfter());

        return toSummary(app);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ExecutiveApplication findById(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Candidatura não encontrada."));
    }

    private ApplicationSummaryResponse toSummary(ExecutiveApplication app) {
        return new ApplicationSummaryResponse(
            app.getId(), app.getFullName(), app.getEmail(), app.getStatus(), app.getCreatedAt());
    }

    private ApplicationDetailResponse toDetailResponse(ExecutiveApplication app) {
        return new ApplicationDetailResponse(
            app.getId(), app.getFullName(), app.getEmail(),
            app.getLinkedinUrl(), app.getMotivation(),
            app.getStatus(), app.getCreatedAt(),
            app.getPositions().stream().map(p -> new ApplicationDetailResponse.PositionDetail(
                p.getRoleTitle(), p.getCompanyName(), p.getPeriodStart(), p.getPeriodEnd(),
                p.getTeamSize(), p.getRevenueManaged())).toList(),
            app.getReferences().stream().map(r -> new ApplicationDetailResponse.ReferenceDetail(
                r.getRefName(), r.getRefRole(), r.getRefContact())).toList());
    }

    private String escapeLikePattern(String input) {
        return input.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    // P1: extrai apenas a extensão do arquivo original (sem path traversal)
    private String extractExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) return "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot < 0 || dot == originalFilename.length() - 1) return "";
        String ext = originalFilename.substring(dot + 1).replaceAll("[^a-zA-Z0-9]", "");
        return ext.isBlank() ? "" : "." + ext;
    }
}
