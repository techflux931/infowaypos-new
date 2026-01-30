package com.pos.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.pos.model.User;
import com.pos.repository.UserRepository;

@Configuration
public class UserDataLoader {

    @Bean
    ApplicationRunner initUsers(UserRepository repository, PasswordEncoder encoder) {
        return args -> {
            repository.findByUsernameIgnoreCase("admin").orElseGet(() -> {
                // Prefer an env/system-supplied initial password; defaults to a non-trivial value for dev
                String initPw = System.getProperty("ADMIN_INIT_PW",
                                   System.getenv().getOrDefault("ADMIN_INIT_PW", "Admin#12345"));
                User u = new User("admin", encoder.encode(initPw), "ADMIN", "admin@example.com");
                u.setEnabled(true);
                return repository.save(u);
            });
        };
    }
}
