package com.fracexec.api.match.service;

import com.fracexec.api.company.NeedRepository;
import com.fracexec.api.company.NeedStatus;
import com.fracexec.api.match.ExecutiveOpportunity;
import com.fracexec.api.match.ExecutiveOpportunityRepository;
import com.fracexec.api.match.OpportunityStatus;
import com.fracexec.api.notification.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class OpportunityExpirationJob {

    private static final Logger log = LoggerFactory.getLogger(OpportunityExpirationJob.class);
    private static final List<OpportunityStatus> TERMINAL = List.of(
        OpportunityStatus.DECLINED, OpportunityStatus.EXPIRED, OpportunityStatus.RETRACTED
    );

    private final ExecutiveOpportunityRepository opportunityRepository;
    private final NeedRepository                 needRepository;
    private final EmailService                   emailService;

    public OpportunityExpirationJob(ExecutiveOpportunityRepository opportunityRepository,
                                    NeedRepository needRepository,
                                    EmailService emailService) {
        this.opportunityRepository = opportunityRepository;
        this.needRepository        = needRepository;
        this.emailService          = emailService;
    }

    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void expireOpportunities() {
        var expired = opportunityRepository.findAllByStatusAndExpiresAtBefore(
            OpportunityStatus.AVAILABLE, Instant.now()
        );
        for (var opp : expired) {
            opp.setStatus(OpportunityStatus.EXPIRED);
            opportunityRepository.save(opp);
            checkBothDeclinedForNeed(opp);
        }
        if (!expired.isEmpty()) log.info("Expiradas {} oportunidades", expired.size());
    }

    public void checkBothDeclinedForNeed(ExecutiveOpportunity opp) {
        var need = opp.getNeed();
        long total     = opportunityRepository.countByNeedAndStatusIn(need,
            List.of(OpportunityStatus.AVAILABLE, OpportunityStatus.INTERESTED,
                    OpportunityStatus.DECLINED, OpportunityStatus.EXPIRED, OpportunityStatus.RETRACTED));
        long declined  = opportunityRepository.countByNeedAndStatusIn(need, TERMINAL);

        if (total > 0 && total == declined) {
            need.setStatus(NeedStatus.UNDER_ANALYSIS);
            needRepository.save(need);
            log.info("Todos executivos declinaram necessidade [{}] → UNDER_ANALYSIS", need.getId());
            try {
                emailService.sendBothDeclined("admin@fracexec.com", need.getId().toString());
            } catch (Exception e) {
                log.warn("Falha ao notificar admin sobre declínio: {}", e.getClass().getSimpleName());
            }
        }
    }
}
