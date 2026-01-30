// src/main/java/com/pos/controller/TallyController.java
package com.pos.controller;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pos.integrations.tally.TallyPostingService;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/integrations/tally")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TallyController {
  private final TallyPostingService posting;

  // --- PURCHASE ---
  @PostMapping("/purchase")
  public ResponseEntity<?> postPurchase(@RequestBody PurchaseReq r) {
    String resp = posting.postPurchase(
        r.getVNo(),
        r.getDate(),              // ISO yyyy-MM-dd (your curl already uses this)
        r.getVendorLedger(),
        r.isCashPurchase(),
        r.getSub(), r.getVat(), r.getRounding()
    );
    return ResponseEntity.ok(Map.of("status","ok","tally",resp));
  }

  // (optional) SALES/RECEIPT/PAYMENT/EXPENSE endpoints
  @PostMapping("/sales")
  public ResponseEntity<?> postSales(@RequestBody SalesReq r) {
    String resp = posting.postSales(
        r.getVNo(), r.getDate(), r.getPartyLedger(), r.isCashSale(),
        r.getSub(), r.getVat(), r.getRounding()
    );
    return ResponseEntity.ok(Map.of("status","ok","tally",resp));
  }

  @PostMapping("/receipt")
  public ResponseEntity<?> postReceipt(@RequestBody ReceiptReq r) {
    String resp = posting.postReceipt(
        r.getVNo(), r.getDate(), r.getCustomerLedger(), r.isToBank(),
        r.getAmount(), r.getNarration()
    );
    return ResponseEntity.ok(Map.of("status","ok","tally",resp));
  }

  @PostMapping("/payment")
  public ResponseEntity<?> postPayment(@RequestBody PaymentReq r) {
    String resp = posting.postPaymentToVendor(
        r.getVNo(), r.getDate(), r.getVendorLedger(), r.isFromBank(),
        r.getAmount(), r.getNarration()
    );
    return ResponseEntity.ok(Map.of("status","ok","tally",resp));
  }

  @PostMapping("/expense")
  public ResponseEntity<?> postExpense(@RequestBody ExpenseReq r) {
    String resp = posting.postExpensePaid(
        r.getVNo(), r.getDate(), r.getExpenseLedger(), r.isFromBank(),
        r.getAmount(), r.getNarration()
    );
    return ResponseEntity.ok(Map.of("status","ok","tally",resp));
  }

  // return clear JSON when something fails
  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> onError(Exception ex) {
    return ResponseEntity.status(500).body(Map.of("message", ex.getMessage()));
  }

  // ---- DTOs ----
  @Data public static class PurchaseReq {
    private String vNo;
    private LocalDate date;
    private String vendorLedger;
    private boolean cashPurchase;
    private double sub;
    private double vat;
    private double rounding;
  }

  @Data public static class SalesReq {
    private String vNo;
    private LocalDate date;
    private String partyLedger;
    private boolean cashSale;
    private double sub;
    private double vat;
    private double rounding;
  }

  @Data public static class ReceiptReq {
    private String vNo;
    private LocalDate date;
    private String customerLedger;
    private boolean toBank;
    private double amount;
    private String narration;
  }

  @Data public static class PaymentReq {
    private String vNo;
    private LocalDate date;
    private String vendorLedger;
    private boolean fromBank;
    private double amount;
    private String narration;
  }

  @Data public static class ExpenseReq {
    private String vNo;
    private LocalDate date;
    private String expenseLedger;
    private boolean fromBank;
    private double amount;
    private String narration;
  }
}
