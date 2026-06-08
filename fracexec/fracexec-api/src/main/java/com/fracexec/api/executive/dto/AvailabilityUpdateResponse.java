package com.fracexec.api.executive.dto;

import com.fracexec.api.executive.model.ProfileStatus;

public record AvailabilityUpdateResponse(
    int availabilityDaysPerMonth,
    ProfileStatus profileStatus
) {}
