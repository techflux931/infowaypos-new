package com.pos.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetLink(String toEmail) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("POS Admin Password Reset");
        message.setText("Dear Admin,\n\nClick this link to reset your password:\nhttp://localhost:8080/reset-password\n\n- POS System");
        mailSender.send(message);
    }
}
