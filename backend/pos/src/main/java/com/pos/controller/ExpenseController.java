package com.pos.controller;

import com.pos.dto.ExpenseRequest;
import com.pos.dto.ExpenseResponse;
import com.pos.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    private final ExpenseService service;

    public ExpenseController(ExpenseService service) {
        this.service = service;
    }

    // Return a plain array -> matches your frontend (response.data is an array)
    @GetMapping
    public List<ExpenseResponse> list(@RequestParam(defaultValue = "") String search) {
        return service.list(search);
    }

    @GetMapping("/{id}")
    public ExpenseResponse get(@PathVariable String id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@RequestBody ExpenseRequest req) {
        ExpenseResponse created = service.create(req);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(@PathVariable String id, @RequestBody ExpenseRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
