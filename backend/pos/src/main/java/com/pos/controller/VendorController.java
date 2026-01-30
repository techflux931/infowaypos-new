package com.pos.controller;

import com.pos.dto.PageResponse;
import com.pos.dto.VendorRequest;
import com.pos.dto.VendorResponse;
import com.pos.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api/vendors")
@CrossOrigin(origins = "*")
@Validated
public class VendorController {

    private final VendorService service;

    public VendorController(VendorService service) {
        this.service = service;
    }

    @PostMapping
    public VendorResponse create(@Valid @RequestBody VendorRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public VendorResponse update(@PathVariable String id, @Valid @RequestBody VendorRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/active")
    public VendorResponse setActive(@PathVariable String id, @RequestParam(defaultValue = "true") boolean value) {
        return service.toggleActive(id, value);
    }

    @GetMapping("/{id}")
    public VendorResponse get(@PathVariable String id) {
        return service.get(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

    // FIFO default: createdAt ASC (oldest first)
    @GetMapping
    public PageResponse<VendorResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "asc") String dir
    ) {
        return service.list(q, page, size, sortBy, dir);
    }
}
