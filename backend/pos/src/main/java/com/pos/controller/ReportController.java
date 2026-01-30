// src/main/java/com/pos/controller/ReportController.java
package com.pos.controller;

import java.time.LocalDate;

import org.bson.Document;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pos.dto.PageResponse;
import com.pos.dto.ReportResponse;
import com.pos.service.ReportService;
import com.pos.service.VatSummaryService;
import com.pos.service.XReportPdfService;

import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
@Validated
public class ReportController {

  private final ReportService svc;
  private final VatSummaryService vatSummaryService;
  private final XReportPdfService xReportPdfService;

  public ReportController(
      ReportService svc,
      VatSummaryService vatSummaryService,
      XReportPdfService xReportPdfService
  ) {
    this.svc = svc;
    this.vatSummaryService = vatSummaryService;
    this.xReportPdfService = xReportPdfService;
  }

  // ---------- Sales Summary ---------------------------------------------------
  @GetMapping("/sales-summary")
  public ReportResponse<Document> salesSummary(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(required = false) String shift,
      @RequestParam(required = false) String cashier,
      @RequestParam(defaultValue = "DAY") String groupBy, // DAY | SHIFT | CASHIER
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) int size,
      @RequestParam(name = "excludeDiscount", defaultValue = "false") boolean excludeDiscount
  ) {
    return svc.salesSummary(from, to, shift, cashier, groupBy, page, size, excludeDiscount);
  }

  // ---------- Product Sales ---------------------------------------------------
  @GetMapping("/product-sales")
  public ReportResponse<Document> productSales(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(required = false) String shift,
      @RequestParam(required = false) String cashier,
      @RequestParam(required = false, name = "category") String cat,
      @RequestParam(required = false, name = "q") String search,
      @RequestParam(defaultValue = "PRODUCT") String groupBy, // PRODUCT | CATEGORY | DAY | CASHIER
      @RequestParam(required = false) String sortBy,
      @RequestParam(defaultValue = "DESC") String sortDir,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) int size,
      @RequestParam(name = "excludeDiscount", defaultValue = "false") boolean excludeDiscount
  ) {
    return svc.productSales(
        from, to, shift, cashier, cat, search, groupBy, sortBy, sortDir, page, size, excludeDiscount
    );
  }

  // ---------- Day / X / Z (JSON) ---------------------------------------------
  // Accept either a single 'date' OR 'from' + 'to'
  @GetMapping("/dayz")
  public ReportResponse<Document> dayz(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(required = false) String shift,
      @RequestParam(defaultValue = "DAY") String type,  // DAY | X | Z
      @RequestParam(required = false) String sortBy,
      @RequestParam(defaultValue = "ASC") String sortDir,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) int size,
      @RequestParam(name = "excludeDiscount", defaultValue = "false") boolean excludeDiscount
  ) {
    LocalDate f = (date != null) ? date : from;
    LocalDate t = (date != null) ? date : to;
    if (f == null || t == null) {
      throw new IllegalArgumentException("Provide either 'date' or both 'from' and 'to'.");
    }
    return svc.dayZ(f, t, shift, type, sortBy, sortDir, page, size, excludeDiscount);
  }

  // ---------- X Report PDF (download) ----------------------------------------
  @GetMapping("/x/pdf")
  public ResponseEntity<byte[]> xReportPdf(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

    byte[] pdf = xReportPdfService.buildXReportPdf(date);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=XReport-" + date + ".pdf")
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdf);
  }

  // ---------- Shift (summary) -------------------------------------------------
  @GetMapping("/shift")
  public ReportResponse<Document> shift(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return svc.shift(from, to);
  }

  // ---------- Customer --------------------------------------------------------
  @GetMapping("/customer")
  public ReportResponse<Document> customer(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "50") @Min(1) int size) {
    return svc.customer(from, to, page, size);
  }

  // ---------- Purchase --------------------------------------------------------
  @GetMapping("/purchase")
  public ReportResponse<Document> purchase(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "50") @Min(1) int size) {
    return svc.purchase(from, to, page, size);
  }

  // ---------- Returns / Cancellation -----------------------------------------
  @GetMapping("/returns")
  public ReportResponse<Document> returns(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(required = false) String cashier,
      @RequestParam(required = false) String reason,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) int size) {
    return svc.returns(from, to, cashier, reason, page, size);
  }

  // ---------- VAT (existing) --------------------------------------------------
  @GetMapping("/vat")
  public ReportResponse<Document> vat(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "DAY") String groupBy, // DAY | SUMMARY
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) int size) {
    return svc.vat(from, to, groupBy, page, size);
  }

  // ---------- VAT Summary (NEW) ----------------------------------------------
  @GetMapping("/vat-summary")
  public PageResponse<Document> vatSummary(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "day") String groupBy,    // day | month | invoice
      @RequestParam(defaultValue = "0")  @Min(0) int page,   // zero-based
      @RequestParam(defaultValue = "20") @Min(1) int size) {
    return vatSummaryService.summary(from, to, groupBy, page, size);
  }

  // ---------- Expenses --------------------------------------------------------
  @GetMapping("/expenses")
  public ReportResponse<Document> expenses(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "50") @Min(1) int size) {
    return svc.expenses(from, to, page, size);
  }

  // ---------- Supplier Outstanding -------------------------------------------
  @GetMapping("/supplier-outstanding")
  public ReportResponse<Document> supplierOutstanding(
      @RequestParam(name = "asOf") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf,
      @RequestParam(defaultValue = "0")  @Min(0) int page,
      @RequestParam(defaultValue = "50") @Min(1) int size) {
    return svc.supplierOutstanding(asOf, page, size);
  }
}
