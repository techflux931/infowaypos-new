package com.pos.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.dto.ForgotRequest;
import com.pos.dto.LoginRequest;
import com.pos.model.User;
import com.pos.repository.UserRepository;
import com.pos.service.EmailService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class LoginController {

    private final UserRepository userRepository;
    private final EmailService emailService;

    public LoginController(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public User login(@RequestBody LoginRequest request) {
        return userRepository.findByUsernameAndPassword(request.getUsername(), request.getPassword());
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody ForgotRequest request) {
        User user = userRepository.findByUsername(request.getUsername());

        if (user == null) return "User not found";

        if (!"admin".equalsIgnoreCase(user.getRole()))
            return "Access denied: Only Admin users can reset password.";

        if ("techfluxsoftware@gmail.com".equalsIgnoreCase(user.getEmail())) {
            emailService.sendResetLink(user.getEmail());
            return "Reset link sent to techfluxsoftware@gmail.com";
        } else {
            return "Admin email is not configured correctly";
        }
    }
}
