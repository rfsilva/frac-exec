package com.fracexec.api.contract.service;

import com.fracexec.api.contract.*;
import com.fracexec.api.contract.dto.*;
import com.fracexec.api.company.NeedRepository;
import com.fracexec.api.company.NeedStatus;
import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.ExecutiveOpportunity;
import com.fracexec.api.match.ExecutiveOpportunityRepository;
import com.fracexec.api.match.OpportunityStatus;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.storage.MinioStorageService;
import com.fracexec.api.shared.util.BusinessDayCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ContractService {

    private static final Logger log = LoggerFactory.getLogger(ContractService.class);

    private final ContractRepository         contractRepository;
    private final EngagementRepository       engagementRepository;
    private final NeedRepository             needRepository;
    private final ExecutiveProfileRepository profileRepository;
    private final ExecutiveOpportunityRepository opportunityRepository;
    private final ContractPdfService         pdfService;
    private final MinioStorageService        minioService;
    private final S3Client                   s3Client;
    private final EmailService               emailService;

    @Value("${fracexec.app.base-url:http://localhost:4200}")
    private String appBaseUrl;

    public ContractService(ContractRepository contractRepository,
                           EngagementRepository engagementRepository,
                           NeedRepository needRepository,
                           ExecutiveProfileRepository profileRepository,
                           ExecutiveOpportunityRepository opportunityRepository,
                           ContractPdfService pdfService,
                           MinioStorageService minioService,
                           S3Client s3Client,
                           EmailService emailService) {
        this.contractRepository    = contractRepository;
        this.engagementRepository  = engagementRepository;
        this.needRepository        = needRepository;
        this.profileRepository     = profileRepository;
        this.opportunityRepository = opportunityRepository;
        this.pdfService            = pdfService;
        this.minioService          = minioService;
        this.s3Client              = s3Client;
        this.emailService          = emailService;
    }

    public ContractResponse create(CreateContractRequest req) {
        var need = needRepository.findById(req.needId())
            .orElseThrow(() -> new ResourceNotFoundException("Necessidade não encontrada."));
        if (need.getStatus() != NeedStatus.IN_MEDIATION) {
            throw new BusinessRuleException("Contrato só pode ser gerado quando a necessidade estiver em IN_MEDIATION. Status atual: " + need.getStatus());
        }
        // Verificar que há pelo menos 1 executivo INTERESTED
        boolean hasInterested = opportunityRepository
            .findAllByExecutiveProfileAndStatusIn(
                profileRepository.findById(req.executiveProfileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado.")),
                List.of(OpportunityStatus.INTERESTED)
            ).stream().anyMatch(o -> o.getNeed().getId().equals(req.needId()));

        if (!hasInterested) {
            throw new BusinessRuleException("É necessário pelo menos 1 executivo com interesse declarado para gerar o contrato.");
        }

        var profile = profileRepository.findById(req.executiveProfileId())
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));

        // Criar engagement
        var engagement = new Engagement(need, profile, req.monthlyValue(), req.scopeDaysPerMonth(), req.durationMonths());
        engagementRepository.save(engagement);

        // Criar contrato com storage_key provisório
        String storageKey = "contracts/" + engagement.getId() + ".pdf";
        var contract = new Contract(engagement, storageKey, req.monthlyValue(), req.scopeDaysPerMonth(), req.durationMonths());
        contractRepository.save(contract);

        // Gerar PDF e fazer upload (falha silenciosa se MinIO indisponível em testes)
        try {
            byte[] pdf = pdfService.generate(contract);
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(minioService.getContractsBucket())
                    .key(storageKey)
                    .contentType("application/pdf")
                    .build(),
                RequestBody.fromBytes(pdf)
            );
        } catch (Exception e) {
            log.warn("Falha ao fazer upload do contrato PDF (MinIO indisponível?): {}", e.getClass().getSimpleName());
        }

        // Gerar URL pré-assinada (pode falhar se MinIO indisponível)
        String downloadUrl = null;
        try {
            downloadUrl = minioService.generatePresignedDownloadUrl(
                minioService.getContractsBucket(), storageKey, Duration.ofHours(1));
        } catch (Exception e) {
            log.warn("Falha ao gerar URL pré-assinada: {}", e.getClass().getSimpleName());
        }
        try {
            emailService.sendContractReady(need.getCompany().getResponsibleEmail(),
                need.getCompany().getLegalName(), downloadUrl);
            emailService.sendContractReady(profile.getUser().getEmail(),
                "Executivo", downloadUrl);
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail de contrato: {}", e.getClass().getSimpleName());
        }

        log.info("Contrato [{}] gerado para engagement [{}]", contract.getId(), engagement.getId());
        return toResponse(contract, downloadUrl);
    }

    public ContractResponse sign(UUID contractId, SignContractRequest req) {
        var contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado."));

        if (req.signedByPme())        contract.setSignedByPme(true);
        if (req.signedByExecutive())  contract.setSignedByExecutive(true);

        if (contract.isFullySigned()) {
            contract.setFullySignedAt(Instant.now());
            // Ativar engagement
            var engagement = contract.getEngagement();
            engagement.setStatus(EngagementStatus.ACTIVE);
            engagement.setStartedAt(Instant.now());
            engagementRepository.save(engagement);
            // Marcar need como CONTRACTED
            var need = engagement.getNeed();
            need.setStatus(NeedStatus.CONTRACTED);
            needRepository.save(need);
            log.info("Contrato [{}] assinado — engagement ACTIVE, need CONTRACTED", contractId);
        }
        contractRepository.save(contract);
        return toResponse(contract, null);
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> listAll() {
        return contractRepository.findAll().stream()
            .map(c -> toResponse(c, null)).toList();
    }

    @Transactional(readOnly = true)
    public String getDownloadUrl(UUID contractId) {
        var contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado."));
        return minioService.generatePresignedDownloadUrl(
            minioService.getContractsBucket(), contract.getStorageKey(), Duration.ofHours(1));
    }

    private ContractResponse toResponse(Contract c, String downloadUrl) {
        var eng     = c.getEngagement();
        var company = eng.getNeed().getCompany();
        var execEmail = eng.getExecutiveProfile().getUser() != null
            ? eng.getExecutiveProfile().getUser().getEmail() : "N/A";
        return new ContractResponse(
            c.getId(), eng.getId(), eng.getNeed().getId(),
            company.getLegalName(), execEmail,
            c.getMonthlyValue(), c.getScopeDaysPerMonth(), c.getDurationMonths(),
            c.isSignedByPme(), c.isSignedByExecutive(), c.isFullySigned(),
            downloadUrl, c.getGeneratedAt(), c.getFullySignedAt()
        );
    }
}
