package com.fracexec.api.match.dto;

import java.util.List;
import java.util.UUID;

public record ShortlistResponse(
    UUID                      id,
    UUID                      needId,
    String                    status,
    List<ShortlistExecutiveItem> executives,
    boolean                   canSend
) {}
