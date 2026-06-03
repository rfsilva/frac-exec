package com.fracexec.api.company;

import com.fracexec.api.shared.auth.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    boolean           existsByCnpj(String cnpj);
    boolean           existsByResponsibleEmail(String email);
    Optional<Company> findByUser(User user);
    Page<Company>     findByStatus(CompanyStatus status, Pageable pageable);
}
