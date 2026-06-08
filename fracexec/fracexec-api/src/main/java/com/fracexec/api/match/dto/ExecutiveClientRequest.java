package com.fracexec.api.match.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ExecutiveClientRequest(

    @NotBlank
    @Pattern(regexp = "[0-9]{2}", message = "cnae2digit deve conter exatamente 2 dígitos numéricos")
    String cnae2digit,

    @NotBlank
    @Size(min = 2, max = 2, message = "regionState deve ser a sigla de 2 letras do estado (ex: SP)")
    String regionState,

    String regionCity,
    String companySizeRange
) {}
