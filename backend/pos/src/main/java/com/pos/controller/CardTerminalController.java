// src/main/java/com/pos/controller/CardTerminalController.java
package com.pos.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices/card")
@CrossOrigin(origins = "*")
public class CardTerminalController {

    @PostMapping("/charge")
    public Map<String, String> charge(@RequestBody Map<String, Object> body) {
        double amount = Double.parseDouble(body.get("amount").toString());

        // TODO: integrate with real card SDK/driver here
        boolean success = true; // simulate approval

        if (success) {
            return Map.of("status", "APPROVED", "message", "Transaction successful");
        } else {
            return Map.of("status", "DECLINED", "message", "Insufficient funds");
        }
    }
}
