package com.fracexec.api.match.service;

import com.fracexec.api.match.dto.AddExecutiveRequest;
import com.fracexec.api.match.dto.ShortlistExecutiveItem;
import com.fracexec.api.match.dto.ShortlistResponse;

import java.util.UUID;

public interface ShortlistService {
    ShortlistResponse getOrCreate(UUID needId);
    ShortlistExecutiveItem addExecutive(UUID needId, AddExecutiveRequest req);
    void removeExecutive(UUID needId, UUID itemId);
    ShortlistResponse decideConflict(UUID itemId, String decision, UUID adminUserId);
    ShortlistResponse send(UUID needId, UUID adminUserId);
}
