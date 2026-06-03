package com.fracexec.api.company;

import com.fracexec.api.company.dto.CompanyRegistrationRequest;
import com.fracexec.api.company.dto.CompanyRegistrationResponse;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import com.fracexec.api.shared.exception.BusinessRuleException;
import com.fracexec.api.shared.exception.DuplicateResourceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class CompanyServiceImpl implements CompanyService {

    private static final Logger log = LoggerFactory.getLogger(CompanyServiceImpl.class);

    private final CompanyRepository companyRepository;
    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;

    public CompanyServiceImpl(CompanyRepository companyRepository,
                              UserRepository userRepository,
                              PasswordEncoder passwordEncoder) {
        this.companyRepository = companyRepository;
        this.userRepository    = userRepository;
        this.passwordEncoder   = passwordEncoder;
    }

    @Override
    public CompanyRegistrationResponse register(CompanyRegistrationRequest request) {
        // Validar CNPJ (algoritmo de dígito verificador)
        String rawCnpj = request.cnpj().replaceAll("[^\\d]", "");
        if (!isValidCnpj(rawCnpj)) {
            throw new BusinessRuleException("CNPJ inválido. Verifique e tente novamente.");
        }

        // Verificar duplicidade de CNPJ
        if (companyRepository.existsByCnpj(request.cnpj())) {
            throw new DuplicateResourceException("Este CNPJ já possui cadastro na plataforma.");
        }

        // Verificar duplicidade de e-mail
        if (userRepository.existsByEmail(request.responsibleEmail())
                || companyRepository.existsByResponsibleEmail(request.responsibleEmail())) {
            throw new DuplicateResourceException(
                "Este e-mail já possui cadastro. Acesse sua conta ou recupere a senha.");
        }

        // Criar usuário PME com senha temporária aleatória
        String tempPassword = passwordEncoder.encode(UUID.randomUUID().toString());
        User user = new User(request.responsibleEmail(), tempPassword, Role.PME);
        userRepository.save(user);
        log.info("Usuário PME criado com ID [{}]", user.getId());

        // Criar empresa com status PENDING_ACTIVATION
        Company company = new Company(
            request.legalName(),
            request.cnpj(),
            request.sector(),
            request.employeeRange().name(),
            request.annualRevenueRange().name(),
            request.responsibleName(),
            request.responsibleEmail(),
            user
        );
        companyRepository.save(company);
        log.info("Empresa criada com ID [{}] e status PENDING_ACTIVATION", company.getId());

        return new CompanyRegistrationResponse(
            company.getId(),
            "Cadastro recebido. O time FracExec ativará seu acesso em breve."
        );
    }

    // Algoritmo de validação de CNPJ (módulo 11)
    static boolean isValidCnpj(String digits) {
        if (digits == null || digits.length() != 14) return false;
        // Rejeitar sequências repetidas (ex: 00000000000000)
        if (digits.chars().distinct().count() == 1) return false;

        int[] d = digits.chars().map(c -> c - '0').toArray();

        // 1º dígito verificador
        int[] w1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int sum1 = 0;
        for (int i = 0; i < 12; i++) sum1 += d[i] * w1[i];
        int r1 = sum1 % 11;
        int dv1 = (r1 < 2) ? 0 : (11 - r1);
        if (d[12] != dv1) return false;

        // 2º dígito verificador
        int[] w2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int sum2 = 0;
        for (int i = 0; i < 13; i++) sum2 += d[i] * w2[i];
        int r2 = sum2 % 11;
        int dv2 = (r2 < 2) ? 0 : (11 - r2);
        return d[13] == dv2;
    }
}
