package com.fracexec.api.admin;

import com.fracexec.api.match.dto.*;
import com.fracexec.api.match.service.ShortlistService;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/needs/{needId}/shortlist")
@PreAuthorize("hasRole('ADMIN')")
public class AdminShortlistController {

    private final ShortlistService shortlistService;
    private final UserRepository   userRepository;

    public AdminShortlistController(ShortlistService shortlistService,
                                    UserRepository userRepository) {
        this.shortlistService = shortlistService;
        this.userRepository   = userRepository;
    }

    @GetMapping
    public ShortlistResponse get(@PathVariable UUID needId) {
        return shortlistService.getOrCreate(needId);
    }

    @PostMapping("/executives")
    @ResponseStatus(HttpStatus.CREATED)
    public ShortlistExecutiveItem addExecutive(@PathVariable UUID needId,
                                               @Valid @RequestBody AddExecutiveRequest req) {
        return shortlistService.addExecutive(needId, req);
    }

    @DeleteMapping("/executives/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeExecutive(@PathVariable UUID needId, @PathVariable UUID itemId) {
        shortlistService.removeExecutive(needId, itemId);
    }

    @PostMapping("/send")
    public ShortlistResponse send(@PathVariable UUID needId, Authentication auth) {
        UUID adminId = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."))
            .getId();
        return shortlistService.send(needId, adminId);
    }
}
