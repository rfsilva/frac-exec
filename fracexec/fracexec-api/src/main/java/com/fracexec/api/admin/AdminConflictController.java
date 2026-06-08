package com.fracexec.api.admin;

import com.fracexec.api.match.dto.ConflictDecisionRequest;
import com.fracexec.api.match.dto.ShortlistResponse;
import com.fracexec.api.match.service.ShortlistService;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/shortlist-executives")
@PreAuthorize("hasRole('ADMIN')")
public class AdminConflictController {

    private final ShortlistService shortlistService;
    private final UserRepository   userRepository;

    public AdminConflictController(ShortlistService shortlistService,
                                   UserRepository userRepository) {
        this.shortlistService = shortlistService;
        this.userRepository   = userRepository;
    }

    @PatchMapping("/{itemId}/conflict-decision")
    public ShortlistResponse decide(@PathVariable UUID itemId,
                                    @Valid @RequestBody ConflictDecisionRequest req,
                                    Authentication auth) {
        UUID adminId = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."))
            .getId();
        return shortlistService.decideConflict(itemId, req.decision(), adminId);
    }
}
