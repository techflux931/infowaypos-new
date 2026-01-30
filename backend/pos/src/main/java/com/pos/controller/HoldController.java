// src/main/java/com/pos/controller/HoldController.java
package com.pos.controller;

import java.util.Date;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pos.model.Hold;
import com.pos.model.Sale;
import com.pos.service.HoldService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/holds")
@CrossOrigin(origins = "*") // or read from config
@RequiredArgsConstructor
public class HoldController {

    private final HoldService service;

    @GetMapping
    public Page<Hold> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int p = Math.max(page, 0);
        int s = Math.min(Math.max(size, 1), 200);
        return service.search(q, from, to, PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "date")));
    }

    @GetMapping("{id}")
    public Hold get(@PathVariable String id) {
        return service.find(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Hold not found: " + id));
    }

    @PostMapping
    public Hold create(@RequestBody Hold hold) {
        return service.save(hold);
    }

    @DeleteMapping("{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }

    /** Convert hold → sale, then delete hold */
    @PostMapping("{id}/commit")
    public Sale commit(@PathVariable String id) { return service.commit(id); }
}
