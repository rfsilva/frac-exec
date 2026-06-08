package com.fracexec.api.admin;

import com.fracexec.api.contract.dto.*;
import com.fracexec.api.contract.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/contracts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminContractController {

    private final ContractService contractService;

    public AdminContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping
    public List<ContractResponse> list() {
        return contractService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContractResponse create(@Valid @RequestBody CreateContractRequest req) {
        return contractService.create(req);
    }

    @PostMapping("/{id}/sign")
    public ContractResponse sign(@PathVariable UUID id,
                                  @RequestBody SignContractRequest req) {
        return contractService.sign(id, req);
    }

    @GetMapping("/{id}/download")
    public Map<String, String> download(@PathVariable UUID id) {
        return Map.of("url", contractService.getDownloadUrl(id));
    }
}
