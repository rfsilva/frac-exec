package com.fracexec.api.account;

import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DataAnonymizationJobTest {

    @Autowired DataAnonymizationJob job;
    @Autowired DeletionRequestRepository deletionRepository;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void processRequests_solicitacaoPendente_anonimizaEMarcaProcessed() {
        User user = new User("daj.user@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(user);

        DeletionRequest req = new DeletionRequest(user, Instant.now().minusSeconds(60), DeletionStatus.PENDING);
        deletionRepository.save(req);

        job.processRequests();

        var updated = deletionRepository.findById(req.getId()).orElseThrow();
        assertEquals(DeletionStatus.PROCESSED, updated.getStatus());
        assertNotNull(updated.getProcessedAt());
    }

    @Test
    void processRequests_semSolicitacoes_naoFazNada() {
        assertDoesNotThrow(() -> job.processRequests());
    }

    @Test
    void processRequests_solicitacaoAindaNoPrazo_naoProcessa() {
        User user = new User("daj.wait@test.com", passwordEncoder.encode("p"), Role.EXECUTIVE);
        userRepository.save(user);

        DeletionRequest req = new DeletionRequest(user, Instant.now().plusSeconds(3600L * 24 * 30), DeletionStatus.PENDING);
        deletionRepository.save(req);

        job.processRequests();

        var updated = deletionRepository.findById(req.getId()).orElseThrow();
        assertEquals(DeletionStatus.PENDING, updated.getStatus()); // não processado
    }
}
