package com.fracexec.api.company.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CompanyRegistrationRequest(

    @NotBlank
    String legalName,

    @NotBlank
    @Pattern(regexp = "\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}",
             message = "Formato de CNPJ inválido. Use XX.XXX.XXX/XXXX-XX")
    String cnpj,

    @NotBlank
    String sector,

    @NotNull
    EmployeeRange employeeRange,

    @NotNull
    AnnualRevenueRange annualRevenueRange,

    @NotBlank
    String responsibleName,

    @NotBlank
    @Email
    String responsibleEmail
) {}
