package com.fracexec.api.admin.need;

import jakarta.validation.constraints.NotBlank;

public record AdminNeedStatusRequest(@NotBlank String status) {}
