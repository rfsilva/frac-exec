package com.fracexec.api.company;

import com.fracexec.api.contract.*;
import com.fracexec.api.contract.dto.PaymentIntentResponse;
import com.fracexec.api.contract.dto.PaymentResponse;
import com.fracexec.api.contract.service.PaymentService;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/company")
@PreAuthorize("hasRole('PME')")
public class CompanyPaymentController {

    private final PaymentService     paymentService;
    private final EngagementRepository engagementRepository;
    private final CompanyRepository  companyRepository;
    private final UserRepository     userRepository;

    public CompanyPaymentController(PaymentService paymentService,
                                     EngagementRepository engagementRepository,
                                     CompanyRepository companyRepository,
                                     UserRepository userRepository) {
        this.paymentService       = paymentService;
        this.engagementRepository = engagementRepository;
        this.companyRepository    = companyRepository;
        this.userRepository       = userRepository;
    }

    @PostMapping("/engagements/{engagementId}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentIntentResponse createPayment(@PathVariable UUID engagementId,
                                               Authentication auth) {
        validateEngagementOwnership(engagementId, auth);
        return paymentService.createPaymentIntent(engagementId);
    }

    @GetMapping("/payments")
    public List<PaymentResponse> listPayments(Authentication auth) {
        var user    = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        var company = companyRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));
        var engagements = engagementRepository.findAll().stream()
            .filter(e -> e.getNeed().getCompany().getId().equals(company.getId()))
            .toList();
        return paymentService.listByEngagements(engagements);
    }

    private void validateEngagementOwnership(UUID engagementId, Authentication auth) {
        var user    = userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        var company = companyRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa não encontrada."));
        var engagement = engagementRepository.findById(engagementId)
            .orElseThrow(() -> new ResourceNotFoundException("Engajamento não encontrado."));
        if (!engagement.getNeed().getCompany().getId().equals(company.getId())) {
            throw new com.fracexec.api.shared.exception.ForbiddenException("Engajamento não pertence à sua empresa.");
        }
    }
}
