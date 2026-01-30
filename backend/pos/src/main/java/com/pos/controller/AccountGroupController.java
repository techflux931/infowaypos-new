// src/main/java/com/pos/controller/AccountGroupController.java
package com.pos.controller;

import com.pos.dto.GroupRequest;
import com.pos.dto.GroupRow;
import com.pos.dto.IdName;
import com.pos.service.AccountGroupService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "/api/accounts/groups", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin // adjust origins if needed
public class AccountGroupController {

    private final AccountGroupService service;

    public AccountGroupController(AccountGroupService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<GroupRow>> list(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(service.listRows(q, page, size));
    }

    /** For dropdowns (id + name only) */
    @GetMapping("/all")
    public ResponseEntity<List<IdName>> all() {
        return ResponseEntity.ok(service.all());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GroupRow> create(@Valid @RequestBody GroupRequest req) {
        GroupRow saved = service.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GroupRow> update(@PathVariable String id,
                                           @Valid @RequestBody GroupRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
