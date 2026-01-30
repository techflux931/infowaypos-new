package com.pos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.pos.model.User;
import com.pos.repository.UserRepository;

@Configuration
@Profile("dev") // only in dev
public class DataSeeder {

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword; // set in application-dev.yml or env var

    @Bean
    ApplicationRunner seedUsers(UserRepository repo, PasswordEncoder encoder) {
        return args -> {
            if (adminPassword == null || adminPassword.isBlank()) return; // no hardcoded value
            repo.findByUsernameIgnoreCase("admin").orElseGet(() -> {
                User u = new User("admin", encoder.encode(adminPassword), "ADMIN", "admin@example.com");
                u.setEnabled(true);
                return repo.save(u);
            });
        };
    }
}
