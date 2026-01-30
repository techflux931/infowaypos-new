// src/main/java/com/pos/controller/InvoiceController.java
package com.pos.controller;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
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

import com.pos.integrations.tally.TallyPostingService;
import com.pos.model.Invoice;
import com.pos.repository.InvoiceRepository;
import com.pos.service.InvoiceService;
import com.pos.service.TallySettingService;
import com.pos.util.InvoicePDFGenerator;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;

    // Tally integration
    private final TallyPostingService postingService;
    private final TallySettingService tallySettingService;

    public InvoiceController(InvoiceRepository invoiceRepository,
                             InvoiceService invoiceService,
                             TallyPostingService postingService,
                             TallySettingService tallySettingService) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceService = invoiceService;
        this.postingService = postingService;
        this.tallySettingService = tallySettingService;
    }

    // =====================================================
    // BASIC CRUD
    // =====================================================

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable String id) {
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Invoice> saveInvoice(@RequestBody Invoice invoice) {
        try {
            // Service will:
            //  - set date & invoiceNo if missing
            //  - normalize items
            //  - compute netTotal & vat
            //  - generate UAE E-Invoice QR (eInvoiceQr)
            Invoice saved = invoiceService.saveInvoice(invoice);

            // Optional: auto-post to Tally (best-effort)
            autoPostToTally(saved);

            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            // TODO: add proper logging (logger.error) if needed
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteInvoice(@PathVariable String id) {
        try {
            invoiceRepository.deleteById(id);
            return ResponseEntity.ok("Invoice deleted successfully");
        } catch (Exception ex) {
            return ResponseEntity.badRequest()
                    .body("Error deleting invoice: " + ex.getMessage());
        }
    }

    // =====================================================
    // PDF ENDPOINTS
    // =====================================================

    @GetMapping("/a4/{id}")
    public ResponseEntity<byte[]> getInvoiceA4(@PathVariable String id) {
        return invoiceRepository.findById(id)
                .map(inv -> ResponseEntity.ok()
                        .header(
                                HttpHeaders.CONTENT_DISPOSITION,
                                "inline; filename=invoice-a4-" + inv.getInvoiceNo() + ".pdf"
                        )
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(InvoicePDFGenerator.generateA4(inv)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/thermal/{id}")
    public ResponseEntity<byte[]> getInvoiceThermal(@PathVariable String id) {
        return invoiceRepository.findById(id)
                .map(inv -> ResponseEntity.ok()
                        .header(
                                HttpHeaders.CONTENT_DISPOSITION,
                                "inline; filename=invoice-thermal-" + inv.getInvoiceNo() + ".pdf"
                        )
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(InvoicePDFGenerator.generateThermal(inv)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // =====================================================
    // INTERNAL HELPERS
    // =====================================================

    private void autoPostToTally(Invoice saved) {
        try {
            if (!tallySettingService.get().isAutoPostSales()) {
                return;
            }

            // Later you can use saved.getPaymentType() for CASH / CREDIT etc.
            boolean cashSale = false; // default for now

            LocalDate voucherDate = toLocalDate(saved.getDate());
            String partyLedger = Optional.ofNullable(saved.getCustomerName()).orElse("");

            double vat = Math.max(0d, saved.getVat());
            double netTotal = Math.max(0d, saved.getNetTotal());

            // Subtotal before VAT
            double gross = round2(netTotal - vat);

            postingService.postSales(
                    saved.getId(),      // voucher reference
                    voucherDate,
                    partyLedger,
                    cashSale,
                    round2(gross),      // subtotal (excl. VAT)
                    round2(vat),        // VAT amount
                    0d                  // rounding difference
            );
        } catch (Exception ignore) {
            // Best-effort: don’t block invoice save if Tally fails.
            // TODO: add logger.warn(...) if you want to track failures.
        }
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static LocalDate toLocalDate(Date date) {
        if (date == null) {
            return LocalDate.now();
        }
        return date.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }
}
