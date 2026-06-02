package com.fracexec.api.executive;

import com.fracexec.api.executive.dto.ApplicationRequest;
import com.fracexec.api.executive.dto.ApplicationResponse;
import com.fracexec.api.executive.service.ExecutiveApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/applications")
public class ExecutiveApplicationController {

    private final ExecutiveApplicationService applicationService;

    public ExecutiveApplicationController(ExecutiveApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> submit(@Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.submit(request));
    }
}
