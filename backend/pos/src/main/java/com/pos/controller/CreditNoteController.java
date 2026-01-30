package com.pos.controller;

import com.pos.dto.CreditNoteRequest;
import com.pos.dto.PageResponse;                 // ✅ use PageResponse
import com.pos.model.CreditNote;
import com.pos.service.CreditNoteService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/credit-notes")
@CrossOrigin(origins = "*")
@Validated
public class CreditNoteController {

    private static final int MAX_PAGE_SIZE = 200;

    // For JDK <= 20. On JDK 21+, you could use Math.clamp(v, lo, hi).
    private static int clamp(int v, int lo, int hi) { return Math.max(lo, Math.min(hi, v)); }
    private static String nullIfBlank(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

    private final CreditNoteService service;

    public CreditNoteController(CreditNoteService service) {
        this.service = service;
    }

    // ---------- Create ----------
    @PostMapping
    public ResponseEntity<CreditNote> create(@Valid @RequestBody CreditNoteRequest req,
                                             @RequestHeader(value = "X-User", required = false) String user,
                                             @RequestParam(defaultValue = "Draft") String status) {
        try {
            String actor = (user == null || user.isBlank()) ? "system" : user.trim();
            CreditNote saved = service.create(actor, req, status);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create credit note", ex);
        }
    }

    // ---------- Update ----------
    @PutMapping("/{id}")
    public ResponseEntity<CreditNote> update(@PathVariable String id,
                                             @Valid @RequestBody CreditNoteRequest req) {
        try {
            return ResponseEntity.ok(service.update(id, req));
        } catch (com.pos.service.NotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    // ---------- List (paged) ----------
    @GetMapping
    public ResponseEntity<PageResponse<CreditNote>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "ASC") String order) {

        int pageSize = clamp(size, 1, MAX_PAGE_SIZE);

        Sort.Direction dir = "DESC".equalsIgnoreCase(order) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(dir, "createdAt")
                        .and(Sort.by(dir, "creditNoteDate"))
                        .and(Sort.by(dir, "id"));

        PageRequest pr = PageRequest.of(Math.max(page, 0), pageSize, sort);
        Page<CreditNote> p = service.list(nullIfBlank(status), nullIfBlank(q), pr);

        PageResponse<CreditNote> body = new PageResponse<>();
        body.setContent(p.getContent());
        body.setTotalElements(p.getTotalElements());
        body.setTotalPages(p.getTotalPages());
        body.setPage(p.getNumber());
        body.setSize(p.getSize());
        body.setLast(p.isLast());

        return ResponseEntity.ok(body);
    }

    // ---------- Get by id ----------
    @GetMapping("/{id}")
    public ResponseEntity<CreditNote> get(@PathVariable String id) {
        try {
            return ResponseEntity.ok(service.get(id));
        } catch (com.pos.service.NotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    // ---------- Delete ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (com.pos.service.NotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        }
    }

    // ---------- Change status ----------
    @PostMapping("/{id}/status")
    public ResponseEntity<CreditNote> setStatus(@PathVariable String id,
                                                @RequestParam String status) {
        try {
            return ResponseEntity.ok(service.setStatus(id, status));
        } catch (com.pos.service.NotFoundException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage(), ex);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }
}
