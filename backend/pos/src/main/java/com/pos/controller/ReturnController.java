// src/main/java/com/pos/controller/ReturnController.java
package com.pos.controller;

import com.pos.dto.ReturnRequest;
import com.pos.model.ReturnTxn;
import com.pos.repository.ReturnTxnRepository;
import com.pos.service.ReturnAuthService;
import com.pos.service.ReturnService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/api/return", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(origins = "http://localhost:3000") // tighten for prod
public class ReturnController {

    private final ReturnService returnService;
    private final ReturnTxnRepository repo;
    @SuppressWarnings("unused")
    private final ReturnAuthService authService; // kept if you need it

    public ReturnController(ReturnService returnService,
                            ReturnAuthService authService,
                            ReturnTxnRepository repo) {
        this.returnService = returnService;
        this.authService = authService;
        this.repo = repo;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ReturnTxn create(@RequestBody @Valid ReturnRequest req) {
        return returnService.create(req);
    }

    @GetMapping
    public List<ReturnTxn> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ReturnTxn get(@PathVariable String id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Return not found"));
    }
}
