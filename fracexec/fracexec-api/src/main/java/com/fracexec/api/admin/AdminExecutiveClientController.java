package com.fracexec.api.admin;

import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.ExecutiveClient;
import com.fracexec.api.match.ExecutiveClientRepository;
import com.fracexec.api.match.dto.ExecutiveClientRequest;
import com.fracexec.api.match.dto.ExecutiveClientResponse;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/executives/{profileId}/clients")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExecutiveClientController {

    private final ExecutiveClientRepository clientRepository;
    private final ExecutiveProfileRepository profileRepository;

    public AdminExecutiveClientController(ExecutiveClientRepository clientRepository,
                                          ExecutiveProfileRepository profileRepository) {
        this.clientRepository = clientRepository;
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public List<ExecutiveClientResponse> list(@PathVariable UUID profileId) {
        var profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));
        return clientRepository.findAllByExecutiveProfile(profile).stream()
            .map(this::toResponse)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExecutiveClientResponse create(@PathVariable UUID profileId,
                                          @Valid @RequestBody ExecutiveClientRequest req) {
        var profile = profileRepository.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));
        var client = new ExecutiveClient(
            profile,
            req.cnae2digit().toUpperCase(),
            req.regionState().toUpperCase(),
            req.regionCity(),
            req.companySizeRange()
        );
        return toResponse(clientRepository.save(client));
    }

    @DeleteMapping("/{clientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID profileId, @PathVariable UUID clientId) {
        var client = clientRepository.findById(clientId)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente não encontrado."));
        if (!client.getExecutiveProfile().getId().equals(profileId)) {
            throw new ResourceNotFoundException("Cliente não pertence a este perfil.");
        }
        clientRepository.delete(client);
    }

    private ExecutiveClientResponse toResponse(ExecutiveClient c) {
        return new ExecutiveClientResponse(
            c.getId(), c.getCnae2digit(), c.getRegionState(),
            c.getRegionCity(), c.getCompanySizeRange(), c.getCreatedAt()
        );
    }
}
