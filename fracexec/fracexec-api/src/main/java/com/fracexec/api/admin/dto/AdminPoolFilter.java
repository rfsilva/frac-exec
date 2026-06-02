package com.fracexec.api.admin.dto;

public record AdminPoolFilter(
    String specialty,
    Integer minAvailability,
    String sector,
    String profileStatus
) {}
