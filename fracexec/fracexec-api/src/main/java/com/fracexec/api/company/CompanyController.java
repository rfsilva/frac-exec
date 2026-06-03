package com.fracexec.api.company;

import com.fracexec.api.company.dto.CompanyRegistrationRequest;
import com.fracexec.api.company.dto.CompanyRegistrationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyRegistrationResponse register(@Valid @RequestBody CompanyRegistrationRequest request) {
        return companyService.register(request);
    }
}
