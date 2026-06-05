package com.fracexec.api.shared.config;

import com.fracexec.api.executive.repository.ExecutiveProfileRepository;
import com.fracexec.api.match.ExecutiveClient;
import com.fracexec.api.match.ExecutiveClientRepository;
import com.fracexec.api.shared.auth.model.Role;
import com.fracexec.api.shared.auth.model.User;
import com.fracexec.api.shared.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds a default ADMIN user on startup in local/test profiles.
 * Never active in production (profile "prod" excluded).
 * Credentials are read from env vars with safe local defaults.
 */
@Configuration
@Profile("local")
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public ApplicationRunner seedAdminUser(UserRepository userRepository,
                                           PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = "admin@fracexec.com";
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = new User(adminEmail, passwordEncoder.encode("Admin@FracExec2026!"), Role.ADMIN);
                userRepository.save(admin);
                log.info("DataInitializer: ADMIN user created [{}]", adminEmail);
            } else {
                log.info("DataInitializer: ADMIN user already exists, skipping seed");
            }
        };
    }

    // Seed de clientes para testes de conflito de interesses (5 CNAEs distintos)
    @Bean
    public ApplicationRunner seedExecutiveClients(ExecutiveProfileRepository profileRepository,
                                                   ExecutiveClientRepository clientRepository) {
        return args -> {
            if (clientRepository.count() > 0) return; // já semeado
            profileRepository.findAll().stream().findFirst().ifPresent(profile -> {
                var clients = java.util.List.of(
                    new ExecutiveClient(profile, "62", "SP", "São Paulo", "E_51_200"),   // TI/Software
                    new ExecutiveClient(profile, "47", "RJ", "Rio de Janeiro", "E_11_50"), // Varejo
                    new ExecutiveClient(profile, "86", "MG", "Belo Horizonte", "E_201_500"), // Saúde
                    new ExecutiveClient(profile, "41", "PR", "Curitiba", "E_11_50"),      // Construção
                    new ExecutiveClient(profile, "49", "RS", "Porto Alegre", "E_1_10")    // Transporte
                );
                clientRepository.saveAll(clients);
                log.info("DataInitializer: seeded {} executive clients for conflict testing", clients.size());
            });
        };
    }
}
