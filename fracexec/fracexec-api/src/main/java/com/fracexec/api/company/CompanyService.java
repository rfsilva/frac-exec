package com.fracexec.api.company;

import com.fracexec.api.company.dto.CompanyRegistrationRequest;
import com.fracexec.api.company.dto.CompanyRegistrationResponse;

public interface CompanyService {
    CompanyRegistrationResponse register(CompanyRegistrationRequest request);
}
