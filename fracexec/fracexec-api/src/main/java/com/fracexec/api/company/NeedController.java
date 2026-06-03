package com.fracexec.api.company;

import com.fracexec.api.company.dto.NeedRequest;
import com.fracexec.api.company.dto.NeedResponse;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/company/needs")
@PreAuthorize("hasRole('PME')")
public class NeedController {

    private final NeedService    needService;
    private final UserRepository userRepository;

    public NeedController(NeedService needService, UserRepository userRepository) {
        this.needService    = needService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NeedResponse postNeed(@Valid @RequestBody NeedRequest request, Authentication auth) {
        return needService.postNeed(request, resolveUserId(auth));
    }

    @PostMapping("/draft")
    @ResponseStatus(HttpStatus.CREATED)
    public NeedResponse saveDraft(@Valid @RequestBody NeedRequest request, Authentication auth) {
        return needService.saveDraft(request, resolveUserId(auth));
    }

    @GetMapping("/active")
    public NeedResponse getActiveNeed(Authentication auth) {
        return needService.getActiveNeed(resolveUserId(auth));
    }

    private UUID resolveUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."))
            .getId();
    }
}
