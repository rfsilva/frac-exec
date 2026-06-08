package com.fracexec.api.company;

import com.fracexec.api.company.dto.NeedRequest;
import com.fracexec.api.company.dto.NeedResponse;
import com.fracexec.api.notification.service.EmailService;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import com.fracexec.api.shared.util.BusinessDayCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NeedServiceImpl implements NeedService {

    private static final Logger log = LoggerFactory.getLogger(NeedServiceImpl.class);
    private static final List<NeedStatus> ACTIVE_STATUSES = List.of(
        NeedStatus.RECEIVED, NeedStatus.UNDER_ANALYSIS,
        NeedStatus.SHORTLIST_SENT, NeedStatus.IN_MEDIATION
    );

    private final NeedRepository    needRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository    userRepository;
    private final EmailService      emailService;

    public NeedServiceImpl(NeedRepository needRepository,
                           CompanyRepository companyRepository,
                           UserRepository userRepository,
                           EmailService emailService) {
        this.needRepository    = needRepository;
        this.companyRepository = companyRepository;
        this.userRepository    = userRepository;
        this.emailService      = emailService;
    }

    @Override
    public NeedResponse postNeed(NeedRequest request, UUID userId) {
        Company company = findCompany(userId);
        if (needRepository.existsByCompanyAndStatusIn(company, ACTIVE_STATUSES)) {
            throw new BusinessRuleException("Você já possui uma necessidade ativa.");
        }
        Need need = buildNeed(request, company, NeedStatus.RECEIVED);
        needRepository.save(need);
        log.info("Necessidade criada [{}] para empresa [{}]", need.getId(), company.getId());

        try {
            emailService.sendNeedReceived(company.getResponsibleEmail(), company.getLegalName());
        } catch (Exception e) {
            log.warn("Falha ao enviar e-mail need-received: {}", e.getClass().getSimpleName());
        }

        return toResponse(need);
    }

    @Override
    public NeedResponse saveDraft(NeedRequest request, UUID userId) {
        Company company = findCompany(userId);
        Need need = buildNeed(request, company, NeedStatus.DRAFT);
        needRepository.save(need);
        log.info("Rascunho criado [{}] para empresa [{}]", need.getId(), company.getId());
        return toResponse(need);
    }

    @Override
    @Transactional(readOnly = true)
    public NeedResponse getActiveNeed(UUID userId) {
        Company company = findCompany(userId);
        return needRepository
            .findTopByCompanyAndStatusInOrderByCreatedAtDesc(company, ACTIVE_STATUSES)
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Nenhuma necessidade ativa encontrada."));
    }

    private Company findCompany(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return companyRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada para este usuário."));
    }

    private Need buildNeed(NeedRequest req, Company company, NeedStatus status) {
        return new Need(
            company,
            req.cLevelType(),
            req.scopeDaysPerMonth(),
            req.estimatedDuration(),
            req.desiredStart(),
            req.challengeDescription(),
            req.expectedResult(),
            req.confidentialContext(),
            status
        );
    }

    private NeedResponse toResponse(Need n) {
        Instant slaDeadline = BusinessDayCalculator.addBusinessDays(n.getCreatedAt(), 5);
        return new NeedResponse(
            n.getId(), n.getCLevelType(), n.getScopeDaysPerMonth(),
            n.getEstimatedDuration(), n.getDesiredStart(),
            n.getChallengeDescription(), n.getExpectedResult(),
            n.getStatus().name(), n.getCreatedAt(), slaDeadline
        );
    }
}
