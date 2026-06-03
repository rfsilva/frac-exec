package com.fracexec.api.company;

import com.fracexec.api.company.dto.NeedRequest;
import com.fracexec.api.company.dto.NeedResponse;

import java.util.UUID;

public interface NeedService {
    NeedResponse postNeed(NeedRequest request, UUID userId);
    NeedResponse saveDraft(NeedRequest request, UUID userId);
    NeedResponse getActiveNeed(UUID userId);
}
