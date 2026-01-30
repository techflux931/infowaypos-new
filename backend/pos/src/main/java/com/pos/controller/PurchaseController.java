package com.pos.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.Purchase;
import com.pos.service.PurchaseService;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = {"http://localhost:3000"})  // adjust if you deploy elsewhere
public class PurchaseController {
    private final PurchaseService service;
    public PurchaseController(PurchaseService service) { this.service = service; }

    @PostMapping
    public Purchase create(@RequestBody Purchase p) {
        return service.create(p);
    }

    @GetMapping
    public List<Purchase> list() {
        return service.list();
    }
}
