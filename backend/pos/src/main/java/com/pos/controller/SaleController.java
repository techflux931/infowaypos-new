package com.pos.controller;

import com.pos.model.Sale;
import com.pos.service.SaleService;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*") // allow local frontend tools
public class SaleController {

    private static final int MAX_PAGE_SIZE = 200;

    private final SaleService service;

    public SaleController(SaleService service) {
        this.service = service;
    }

    /** Cashier View Sales grid + filters */
    @GetMapping
    public Page<Sale> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String customer,
            @RequestParam(required = false, name = "type") String paymentType,
            @RequestParam(required = false, name = "saleType") String saleType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int p = Math.max(page, 0);
        int s = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "date"));

        return service.search(
                blankToNull(q),
                blankToNull(customer),
                blankToNull(paymentType),
                blankToNull(saleType),
                from, to, pageable
        );
    }

    /** Fetch a single sale (for reprint/detail) */
    @GetMapping("/{id}")
    public Sale get(@PathVariable String id) {
        return service.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Sale not found"));
    }

    /** Create/commit a sale (POS bill). */
    @PostMapping
    public Sale create(@RequestBody Sale sale) {
        return service.save(sale);
    }

    /** Optional: void/delete a sale */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.deleteById(id);
    }

    @ExceptionHandler(Exception.class)
    public Map<String, String> onError(Exception e) {
        String msg = e.getMessage();
        return Map.of("message", (msg == null || msg.isBlank()) ? "Server error" : msg);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
