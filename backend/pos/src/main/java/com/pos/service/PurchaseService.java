package com.pos.service;

import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pos.model.Purchase;
import com.pos.repository.PurchaseRepository;

@Service
public class PurchaseService {
    private final PurchaseRepository repo;
    public PurchaseService(PurchaseRepository repo) { this.repo = repo; }

    public Purchase create(Purchase p) {
        if (p.getDate() == null) p.setDate(new Date()); // ensure reporting date
        return repo.save(p);
    }
    public List<Purchase> list() {
        return repo.findAll();
    }
}
