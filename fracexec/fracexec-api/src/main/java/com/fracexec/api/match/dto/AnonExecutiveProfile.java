package com.fracexec.api.match.dto;

import java.util.List;
import java.util.UUID;

public record AnonExecutiveProfile(
    UUID        shortlistExecutiveId,
    String      sectorInitials,       // iniciais do cLevelType (ex: "CF" para CFO)
    String      cLevelType,
    List<String> sectors,
    int         availabilityDaysPerMonth,
    String      bioSummary,           // primeiros 150 chars — nunca nome/empresa
    String      conflictStatus        // para exibir ConflictAlertComponent se APPROVED_WITH_ALERT
) {}
