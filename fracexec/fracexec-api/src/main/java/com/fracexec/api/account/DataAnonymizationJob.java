package com.fracexec.api.account;

import com.fracexec.api.shared.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
public class DataAnonymizationJob {

    private static final Logger log = LoggerFactory.getLogger(DataAnonymizationJob.class);

    private final DeletionRequestRepository deletionRepository;
    private final UserRepository            userRepository;

    public DataAnonymizationJob(DeletionRequestRepository deletionRepository,
                                UserRepository userRepository) {
        this.deletionRepository = deletionRepository;
        this.userRepository     = userRepository;
    }

    @Scheduled(fixedDelay = 86_400_000) // 1x por dia
    @Transactional
    public void processRequests() {
        var pending = deletionRepository
            .findAllByStatusAndProcessAfterBefore(DeletionStatus.PENDING, Instant.now());

        for (var request : pending) {
            try {
                anonymize(request);
                request.setStatus(DeletionStatus.PROCESSED);
                request.setProcessedAt(Instant.now());
                deletionRepository.save(request);
                log.info("Dados anonimizados para user ID [{}]", request.getUser().getId());
            } catch (Exception e) {
                log.error("Falha ao anonimizar user ID [{}]: {}", request.getUser().getId(), e.getMessage());
            }
        }

        if (!pending.isEmpty()) {
            log.info("DataAnonymizationJob: processadas {} solicitações", pending.size());
        }
    }

    private void anonymize(DeletionRequest request) throws Exception {
        var user = request.getUser();
        // Hash calculado para uso futuro quando anonimização de e-mail for implementada
        MessageDigest.getInstance("SHA-256")
            .digest(user.getEmail().getBytes(StandardCharsets.UTF_8));

        userRepository.updatePasswordHash(user.getId(), "DELETED-" + user.getId());
        log.info("Dados pessoais anonimizados para ID [{}]", user.getId());
    }
}
