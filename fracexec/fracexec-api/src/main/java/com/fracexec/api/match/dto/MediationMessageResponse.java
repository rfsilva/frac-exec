package com.fracexec.api.match.dto;

import java.time.Instant;
import java.util.UUID;

public record MediationMessageResponse(
    UUID    id,
    String  senderRole,
    String  senderLabel,   // "FracExec" | "Empresa" | "Executivo"
    String  content,
    Instant createdAt,
    UUID    senderId       // null para PME/EXECUTIVE — preenchido apenas para ADMIN
) {}
