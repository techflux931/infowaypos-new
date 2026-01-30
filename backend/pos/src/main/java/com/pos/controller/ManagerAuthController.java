package com.pos.controller;

import com.pos.dto.managerauth.CreateManagerRequest;
import com.pos.dto.managerauth.ManagerAuthResponse;
import com.pos.dto.managerauth.ManagerSummary;
import com.pos.dto.managerauth.UpdateAuthRequest;
import com.pos.dto.managerauth.VerifyAuthRequest;
import com.pos.dto.managerauth.VerifyAuthResponse;
import com.pos.service.ReturnAuthService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(path = "/api/manager-auth", produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
@CrossOrigin(origins = "http://localhost:3000") // tighten/remove in prod
public class ManagerAuthController {

    private final ReturnAuthService service;

    public ManagerAuthController(ReturnAuthService service) {
        this.service = service;
    }

    @GetMapping("/managers")
    public ResponseEntity<List<ManagerSummary>> listManagers() {
        return ResponseEntity.ok(service.listManagers());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ManagerAuthResponse> getAuth(@PathVariable String userId) {
        return ResponseEntity.ok(service.getAuth(userId));
    }

    @PutMapping(path = "/{userId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> updateAuth(@PathVariable String userId,
                                           @RequestBody @Valid UpdateAuthRequest req) {
        service.updateAuth(userId, req);
        return ResponseEntity.noContent().build(); // 204
    }

    @PostMapping(path = "/managers", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ManagerSummary> createManager(@RequestBody @Valid CreateManagerRequest req) {
        ManagerSummary created = service.createManager(req);
        URI location = URI.create("/api/manager-auth/" + created.getId());
        return ResponseEntity.created(location).body(created); // 201
    }

    @PostMapping(path = "/verify", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<VerifyAuthResponse> verify(@RequestBody @Valid VerifyAuthRequest req) {
        return ResponseEntity.ok(service.verify(req));
    }
}
