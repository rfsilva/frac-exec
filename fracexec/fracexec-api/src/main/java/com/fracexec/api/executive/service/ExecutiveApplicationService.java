package com.fracexec.api.executive.service;

import com.fracexec.api.executive.dto.ApplicationRequest;
import com.fracexec.api.executive.dto.ApplicationResponse;

public interface ExecutiveApplicationService {
    ApplicationResponse submit(ApplicationRequest request);
}
