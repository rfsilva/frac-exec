package com.fracexec.api.company;

import com.fracexec.api.contract.*;
import com.fracexec.api.contract.dto.ContractResponse;
import com.fracexec.api.contract.service.ContractService;
import com.fracexec.api.contract.service.PaymentService;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ForbiddenException;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/company")
@PreAuthorize("hasRole('PME')")
public class CompanyContractController {

    private final ContractService      contractService;
    private final ContractRepository   contractRepository;
    private final EngagementRepository engagementRepository;
    private final CompanyRepository    companyRepository;
    private final UserRepository       userRepository;
    private final PaymentService       paymentService;

    public CompanyContractController(ContractService contractService,
                                      ContractRepository contractRepository,
                                      EngagementRepository engagementRepository,
                                      CompanyRepository companyRepository,
                                      UserRepository userRepository,
                                      PaymentService paymentService) {
        this.contractService      = contractService;
        this.contractRepository   = contractRepository;
        this.engagementRepository = engagementRepository;
        this.companyRepository    = companyRepository;
        this.userRepository       = userRepository;
        this.paymentService       = paymentService;
    }

    @GetMapping("/contracts")
    public List<ContractResponse> listContracts(Authentication auth) {
        var company = findCompany(auth);
        return contractRepository.findAll().stream()
            .filter(c -> c.getEngagement().getNeed().getCompany().getId().equals(company.getId()))
            .map(c -> toContractResponse(c, company))
            .filter(r -> r != null)
            .toList();
    }

    @GetMapping("/contracts/{id}/download")
    public Map<String, String> downloadContract(@PathVariable UUID id, Authentication auth) {
        var contract = contractRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Contrato não encontrado."));
        var company = findCompany(auth);
        if (!contract.getEngagement().getNeed().getCompany().getId().equals(company.getId())) {
            throw new ForbiddenException("Contrato não pertence à sua empresa.");
        }
        return Map.of("url", contractService.getDownloadUrl(id));
    }

    @GetMapping("/payments/summary")
    public Map<String, Object> paymentSummary(Authentication auth) {
        var company     = findCompany(auth);
        var engagements = engagementRepository.findAll().stream()
            .filter(e -> e.getNeed().getCompany().getId().equals(company.getId()))
            .toList();
        var payments = paymentService.listByEngagements(engagements);

        var lastPaid = payments.stream()
            .filter(p -> "PAID".equals(p.status()) || "TRANSFERRED".equals(p.status()))
            .max((a, b) -> {
                var ta = a.paidAt();
                var tb = b.paidAt();
                if (ta == null) return -1;
                if (tb == null) return 1;
                return ta.compareTo(tb);
            }).orElse(null);

        var nextDue = payments.stream()
            .filter(p -> "PENDING".equals(p.status()))
            .findFirst().orElse(null);

        return Map.of(
            "lastPayment", lastPaid != null ? lastPaid : Map.of(),
            "nextDue", nextDue != null ? nextDue : Map.of()
        );
    }

    private ContractResponse toContractResponse(Contract c, Company company) {
        if (contractService.getDownloadUrl(c.getId()) == null) return null;
        var execUser = c.getEngagement().getExecutiveProfile().getUser();
        String execEmail = execUser != null ? execUser.getEmail() : "N/A";
        return new ContractResponse(
            c.getId(), c.getEngagement().getId(),
            c.getEngagement().getNeed().getId(),
            company.getLegalName(), execEmail,
            c.getMonthlyValue(), c.getScopeDaysPerMonth(), c.getDurationMonths(),
            c.isSignedByPme(), c.isSignedByExecutive(), c.isFullySigned(),
            null, c.getGeneratedAt(), c.getFullySignedAt());
    }

    private Company findCompany(Authentication auth) {
        var user = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return companyRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));
    }
}
