// src/main/java/com/pos/controller/DealController.java
package com.pos.controller;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.Deal;
import com.pos.model.WhatsAppRequest;
import com.pos.service.DealService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/deals")
@CrossOrigin(origins = "*") // allow from anywhere (adjust for prod if needed)
@RequiredArgsConstructor
public class DealController {

  private static final Logger LOG = LoggerFactory.getLogger(DealController.class);

  private static final String MSG = "message";
  private static final String DEAL_NOT_FOUND = "Deal not found";

  private final DealService dealService;

  /* ------------------------ CRUD ------------------------ */

  @PostMapping
  public ResponseEntity<?> create(@RequestBody Deal deal) {
    try {
      if (deal.getTitle() == null || deal.getTitle().isBlank()) {
        return badRequest("Title is required");
      }
      Deal saved = dealService.saveDeal(deal);
      return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    } catch (Exception e) {
      LOG.error("Error saving deal", e);
      return serverError("Error saving deal: " + e.getMessage());
    }
  }

  @GetMapping
  public ResponseEntity<List<Deal>> list() {
    return ResponseEntity.ok(dealService.getAllDeals());
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> get(@PathVariable String id) {
    return dealService.findById(id)
        .<ResponseEntity<?>>map(ResponseEntity::ok)
        .orElseGet(this::notFound);
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(@PathVariable String id, @RequestBody Deal deal) {
    Optional<Deal> existing = dealService.findById(id);
    if (existing.isEmpty()) return notFound();

    try {
      deal.setId(id);
      Deal saved = dealService.saveDeal(deal);
      return ResponseEntity.ok(saved);
    } catch (Exception e) {
      LOG.error("Error updating deal {}", id, e);
      return serverError("Error updating deal: " + e.getMessage());
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable String id) {
    Optional<Deal> existing = dealService.findById(id);
    if (existing.isEmpty()) return notFound();

    dealService.deleteById(id);
    return ResponseEntity.ok(Map.of(MSG, "Deal deleted"));
  }

  /* ------------------------ PDF ------------------------ */

  /** All deals → single PDF. */
  @GetMapping("/pdf")
  public ResponseEntity<byte[]> downloadAllPdf() {
    try {
      byte[] pdf = dealService.generatePdfBrochure(dealService.getAllDeals());
      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_PDF)
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=deals.pdf")
          .body(pdf);
    } catch (Exception e) {
      LOG.error("All-deals PDF generation failed", e);
      return textError("Error generating PDF: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** Single deal → its own PDF. */
  @GetMapping("/{id}/pdf")
  public ResponseEntity<byte[]> downloadOnePdf(@PathVariable String id) {
    try {
      Optional<Deal> dOpt = dealService.findById(id);
      if (dOpt.isEmpty()) {
        return textError(DEAL_NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      Deal d = dOpt.get();
      byte[] pdf = dealService.generatePdfForDeal(d);

      String safeName = sanitizeFilename(
          (d.getTitle() == null || d.getTitle().isBlank()) ? ("deal_" + id) : d.getTitle()
      ) + ".pdf";

      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_PDF)
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeName + "\"")
          .body(pdf);
    } catch (Exception e) {
      LOG.error("Single-deal PDF generation failed for id={}", id, e);
      return textError("PDF error: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /* ------------------------ WhatsApp ------------------------ */

  @PostMapping("/send")
  public ResponseEntity<?> sendWhatsApp(@RequestBody WhatsAppRequest request) {
    try {
      dealService.sendWhatsAppMessage(request);
      return ResponseEntity.ok(Map.of(MSG, "WhatsApp message(s) sent successfully!"));
    } catch (Exception e) {
      LOG.error("WhatsApp send failed", e);
      return serverError("Error sending WhatsApp: " + e.getMessage());
    }
  }

  /* ------------------------ helpers ------------------------ */

  private ResponseEntity<?> badRequest(String message) {
    return ResponseEntity.badRequest().body(Map.of(MSG, message));
  }

  private ResponseEntity<?> notFound() {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(MSG, DEAL_NOT_FOUND));
  }

  private ResponseEntity<?> serverError(String message) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(MSG, message));
  }

  /** For PDF error responses, keep type=text/plain and still return byte[]. */
  private ResponseEntity<byte[]> textError(String text, HttpStatus status) {
    return ResponseEntity.status(status)
        .contentType(MediaType.TEXT_PLAIN)
        .body(text.getBytes(StandardCharsets.UTF_8));
  }

  /** Make a safe filename from a title. */
  private static String sanitizeFilename(String in) {
    String s = Normalizer.normalize(in, Normalizer.Form.NFKC)
        .replaceAll("[\\p{Cntrl}]", "")
        .replaceAll("[\\\\/:*?\"<>|]", "_")
        .trim();
    if (s.isBlank()) s = "deal";
    return s;
  }
}
