package com.fracexec.api.match.service;

import java.util.UUID;

public interface ConflictDetectionService {

    enum ConflictResult { CONFLICT, CLEAR }

    ConflictResult check(UUID executiveProfileId, String needCnae2digit, String needRegionState);
}
