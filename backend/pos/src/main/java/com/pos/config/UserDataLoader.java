package com.pos.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.pos.model.User;
import com.pos.repository.UserRepository;

@Configuration
public class UserDataLoader {

    private static final String ADMIN = "admin";
    private static final String ADMIN_PASS = "admin123";
    private static final String ADMIN_EMAIL = "techfluxsoftware@gmail.com";

    private static final String CASHIER = "cashier";
    private static final String CASHIER_PASS = "cashier123";
    private static final String CASHIER_EMAIL = "cashier@pos.local";

    /**
     * Load default admin and cashier users if not present.
     */
    @Bean
    public CommandLineRunner loadInitialUsers(UserRepository repository) {
        return args -> {
            if (repository.findByUsername(ADMIN) == null) {
                User admin = new User();
                admin.setUsername(ADMIN);
                admin.setPassword(ADMIN_PASS);
                admin.setRole(ADMIN);
                admin.setEmail(ADMIN_EMAIL);
                repository.save(admin);
            }

            if (repository.findByUsername(CASHIER) == null) {
                User cashier = new User();
                cashier.setUsername(CASHIER);
                cashier.setPassword(CASHIER_PASS);
                cashier.setRole(CASHIER);
                cashier.setEmail(CASHIER_EMAIL);
                repository.save(cashier);
            }
        };
    }
}
