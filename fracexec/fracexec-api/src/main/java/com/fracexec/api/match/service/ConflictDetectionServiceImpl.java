package com.fracexec.api.match.service;

import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.ExecutiveClientRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ConflictDetectionServiceImpl implements ConflictDetectionService {

    private final ExecutiveClientRepository clientRepository;
    private final ExecutiveProfileRepository profileRepository;

    public ConflictDetectionServiceImpl(ExecutiveClientRepository clientRepository,
                                        ExecutiveProfileRepository profileRepository) {
        this.clientRepository = clientRepository;
        this.profileRepository = profileRepository;
    }

    @Override
    public ConflictResult check(UUID executiveProfileId, String needCnae2digit, String needRegionState) {
        var profile = profileRepository.findById(executiveProfileId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil executivo não encontrado."));

        boolean hasConflict = clientRepository
            .existsByExecutiveProfileAndCnae2digitAndRegionState(profile, needCnae2digit, needRegionState);

        return hasConflict ? ConflictResult.CONFLICT : ConflictResult.CLEAR;
    }
}
