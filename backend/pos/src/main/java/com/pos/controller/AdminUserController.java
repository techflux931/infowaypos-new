package com.pos.controller;

import com.pos.repository.UserRepository;
import com.pos.service.ReturnAuthService;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository users;
    private final ReturnAuthService auth;

    // ✅ explicit constructor injection (no Lombok needed)
    public AdminUserController(UserRepository users, ReturnAuthService auth) {
        this.users = users;
        this.auth = auth;
    }

    // ...your endpoints...
}
