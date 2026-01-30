// src/main/java/com/pos/controller/PaymentController.java
package com.pos.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.model.Payment;
import com.pos.payments.dto.CardChargeRequest;
import com.pos.payments.dto.CardChargeResult;
import com.pos.service.CardPaymentService;
import com.pos.service.PaymentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(value = "/api/payments", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(origins = "*")
@Validated
@RequiredArgsConstructor
public class PaymentController {

  private static final ZoneId ZONE = ZoneId.of("Asia/Dubai");

  private final PaymentService payments;
  private final CardPaymentService cardPay;

  /* ============================== UI ENDPOINTS ============================== */

  @GetMapping
  public ResponseEntity<List<Payment>> list(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String type,
      @RequestParam(required = false) String from,
      @RequestParam(required = false) String to
  ) {
    Instant fromI = parseDateOrNull(from, true);
    Instant toI   = parseDateOrNull(to, false);
    return ResponseEntity.ok(payments.search(search, type, fromI, toI));
  }

  @GetMapping("/{id}")
  public ResponseEntity<Payment> getById(@PathVariable String id) {
    Payment p = payments.get(id);
    return (p == null) ? ResponseEntity.notFound().build() : ResponseEntity.ok(p);
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Payment> save(@Valid @RequestBody PaymentUpsertReq body) {
    Payment p = Payment.builder()
        .id(trim(body.id()))
        .date(parseDateFlexible(body.date()))
        .customerName(reqNonBlank(body.customerName(), "customerName"))
        .paymentType(reqNonBlank(body.paymentType(), "paymentType"))
        .amount(reqPositive(body.amount(), "amount"))
        .reference(trim(body.reference()))
        .invoiceId(trim(body.invoiceId()))
        .notes(trim(body.notes()))
        // optional card enrichment
        .currency(trim(body.currency()))
        .status(trim(body.status()))
        .authCode(trim(body.authCode()))
        .rrn(trim(body.rrn()))
        .maskedPan(trim(body.maskedPan()))
        .build();

    return ResponseEntity.ok(payments.save(p));
  }

  /* ================= Card terminal compatibility (stub) ================= */

  /**
   * Frontend calls this before capture. We return a mock AUTHORIZED intent.
   * No dependency on CardPaymentService or your DTOs here (avoids constructor mismatch).
   */
  @PostMapping(value = "/card/intent", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> authorize(@RequestBody Map<String, Object> req) {
    BigDecimal amount = toAmount(req.get("amount"));
    return ResponseEntity.ok(Map.of(
        "id", "AUTH-" + System.currentTimeMillis(),
        "status", "AUTHORIZED",
        "amount", amount,
        "mock", true
    ));
  }

  /** Frontend calls this to finalize the payment. We return a mock CAPTURED. */
  @PostMapping(value = "/card/capture", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> capture(@RequestBody Map<String, Object> req) {
    String paymentId = String.valueOf(req.getOrDefault("paymentId", ""));
    if (paymentId.isBlank()) {
      return badRequest("paymentId is required");
    }
    return ResponseEntity.ok(Map.of(
        "id", paymentId,
        "status", "CAPTURED",
        "mock", true
    ));
  }

  /* ============== Real single-call charge passthrough (unchanged) ============== */

  @PostMapping(value = "/card/charge", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<CardChargeResult> chargeCard(@Valid @RequestBody CardChargeRequest req) {
    CardChargeResult result = cardPay.charge(req);
    HttpStatus status = result.approved() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
    return ResponseEntity.status(status).body(result);
  }

  /* ================================= Helpers ================================= */

  private static Instant parseDateFlexible(String date) {
    if (date == null || date.isBlank()) return Instant.now();
    try { return Instant.parse(date); } catch (DateTimeParseException ignore) {}
    return LocalDate.parse(date).atStartOfDay(ZONE).toInstant();
  }

  private static Instant parseDateOrNull(String date, boolean startOfDay) {
    if (date == null || date.isBlank()) return null;
    try { return Instant.parse(date); } catch (DateTimeParseException ignore) {}
    LocalDate d = LocalDate.parse(date);
    return (startOfDay ? d.atStartOfDay(ZONE) : d.plusDays(1).atStartOfDay(ZONE).minusNanos(1)).toInstant();
  }

  private static String reqNonBlank(String v, String field) {
    if (v == null || v.isBlank()) throw new IllegalArgumentException(field + " is required");
    return v.trim();
  }

  private static BigDecimal reqPositive(BigDecimal v, String field) {
    if (v == null || v.signum() < 0) throw new IllegalArgumentException(field + " must be >= 0");
    return v;
  }

  private static BigDecimal toAmount(Object o) {
    if (o == null) return BigDecimal.ZERO;
    try { return new BigDecimal(o.toString()); } catch (Exception ignore) { return BigDecimal.ZERO; }
  }

  private static String trim(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }

  /* ================================== DTO ================================== */

  public record PaymentUpsertReq(
      String id,
      String date,            // ISO or yyyy-MM-dd
      @NotBlank String customerName,
      @NotBlank String paymentType,
      @NotNull  BigDecimal amount,
      String reference,
      String invoiceId,
      String notes,
      // optional card enrichment
      String currency,
      String status,
      String authCode,
      String rrn,
      String maskedPan
  ) {}

  /* ============================= Error Handling ============================ */

  @ExceptionHandler({ IllegalArgumentException.class, DateTimeParseException.class })
  public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException ex) {
    return ResponseEntity.badRequest().body(Map.of(
        "error", "BadRequest",
        "message", ex.getMessage()
    ));
  }

  private ResponseEntity<Map<String, Object>> badRequest(String message) {
    return ResponseEntity.badRequest().body(Map.of("error", "BadRequest", "message", message));
  }
}
