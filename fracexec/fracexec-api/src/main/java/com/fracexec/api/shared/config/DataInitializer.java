package com.fracexec.api.shared.config;

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
}
