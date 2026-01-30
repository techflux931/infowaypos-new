package com.pos.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.Quote;
import com.pos.service.QuotePdfService;
import com.pos.service.QuoteService;

@RestController
@RequestMapping("/api/quotes")
@CrossOrigin(origins = "http://localhost:3000") // adjust for prod
public class QuoteController {

    private static final String MSG = "message";
    private static final String ERR_SAVE = "Failed to save quote: ";
    private static final String NOT_FOUND = "Quote not found";

    private final QuoteService quoteService;
    private final QuotePdfService quotePdfService;

    public QuoteController(QuoteService quoteService, QuotePdfService quotePdfService) {
        this.quoteService = quoteService;
        this.quotePdfService = quotePdfService;
    }

    @PostMapping
    public ResponseEntity<Object> saveQuote(@RequestBody Quote quote) {
        try {
            if (quote == null || isBlank(quote.getQuoteNumber())) {
                return ResponseEntity.badRequest().body(Map.of(MSG, "Quote number is required"));
            }
            Quote saved = quoteService.saveQuote(quote);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(MSG, ERR_SAVE + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Quote>> getAllQuotes() {
        return ResponseEntity.ok(quoteService.getAllQuotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quote> getQuoteById(@PathVariable String id) {
        Quote q = quoteService.getQuoteById(id);
        if (q == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(q);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteQuote(@PathVariable String id) {
        Quote q = quoteService.getQuoteById(id);
        if (q == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(MSG, NOT_FOUND));
        }
        quoteService.deleteQuote(id);
        return ResponseEntity.noContent().build();
    }

    // PDF for a single quote
    @GetMapping("/pdf/{id}")
    public ResponseEntity<byte[]> getQuotePdf(@PathVariable String id) {
        Quote quote = quoteService.getQuoteById(id);
        if (quote == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        try {
            byte[] pdf = quotePdfService.generateQuotePdfBytes(quote);

            String filename = "quote_" + safe(quote.getQuoteNumber(), id) + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentLength(pdf.length);
            headers.setContentDisposition(
                    ContentDisposition
                            .builder("inline")
                            .filename(filename, StandardCharsets.UTF_8) // <-- String + Charset (not byte[])
                            .build()
            );

            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Optional alias: /{id}/pdf
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getQuotePdfAlias(@PathVariable String id) {
        return getQuotePdf(id);
    }

    // helpers
    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
    private static String safe(String s, String fallback) { return isBlank(s) ? fallback : s; }
}
