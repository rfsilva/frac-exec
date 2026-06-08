package com.fracexec.api.company.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record NeedRequest(

    @NotBlank
    String cLevelType,

    @NotBlank
    String scopeDaysPerMonth,

    String estimatedDuration,

    LocalDate desiredStart,

    @NotBlank
    @Size(min = 50, message = "Descreva o desafio com pelo menos 50 caracteres")
    String challengeDescription,

    @NotBlank
    String expectedResult,

    String confidentialContext
) {}
