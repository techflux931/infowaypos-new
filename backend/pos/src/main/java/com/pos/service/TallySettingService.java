// src/main/java/com/pos/service/TallySettingService.java
package com.pos.service;

import org.springframework.stereotype.Service;

import com.pos.model.TallySetting;
import com.pos.repository.TallySettingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TallySettingService {
  private final TallySettingRepository repo;

  /** Singleton settings doc: create default if missing. */
  public TallySetting get() {
    return repo.findAll().stream().findFirst().orElseGet(this::createDefault);
  }

  /** Merge + normalize, then persist. Protects against blanks when enabled. */
  public TallySetting save(TallySetting incoming) {
    if (incoming == null) throw new IllegalArgumentException("Settings payload is null.");

    TallySetting cur = get();

    // Merge (keep behavior of single settings doc)
    cur.setEnabled(incoming.isEnabled());
    cur.setUrl(normalizeUrl(orBlank(incoming.getUrl())));
    cur.setCompany(orBlank(incoming.getCompany()).trim());

    cur.setCashLedger(orBlank(incoming.getCashLedger()));
    cur.setBankLedger(orBlank(incoming.getBankLedger()));
    cur.setSalesLedger(orBlank(incoming.getSalesLedger()));
    cur.setPurchaseLedger(orBlank(incoming.getPurchaseLedger()));
    cur.setVatOutLedger(orBlank(incoming.getVatOutLedger()));
    cur.setVatInLedger(orBlank(incoming.getVatInLedger()));
    cur.setRoundingLedger(orBlank(incoming.getRoundingLedger()));

    cur.setAutoPostSales(incoming.isAutoPostSales());
    cur.setAutoPostPurchase(incoming.isAutoPostPurchase());
    cur.setAutoPostReceipt(incoming.isAutoPostReceipt());
    cur.setAutoPostPayment(incoming.isAutoPostPayment());
    cur.setAutoPostExpense(incoming.isAutoPostExpense());

    // Basic validation when enabled
    if (cur.isEnabled()) {
      if (isBlank(cur.getUrl()))     throw new IllegalArgumentException("Tally URL must be set when enabled.");
      // Company can be selected from dropdown; if you want to enforce, uncomment:
      // if (isBlank(cur.getCompany())) throw new IllegalArgumentException("Tally company must be set when enabled.");
    }

    return repo.save(cur);
  }

  /* -------------------- helpers -------------------- */

  private TallySetting createDefault() {
    return repo.save(TallySetting.builder()
        .enabled(false)
        .url("http://127.0.0.1:9000")
        .company("")
        .cashLedger("Cash")
        .bankLedger("Bank Accounts")
        .salesLedger("Sales Accounts")
        .purchaseLedger("Purchase Accounts")
        .vatOutLedger("Output VAT @5%")
        .vatInLedger("Input VAT @5%")
        .roundingLedger("Rounding Off")
        .autoPostSales(false)
        .autoPostPurchase(false)
        .autoPostReceipt(false)
        .autoPostPayment(false)
        .autoPostExpense(false)
        .build());
  }

  private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }

  private static String orBlank(String s) { return (s == null) ? "" : s; }

  /** remove trailing slashes; keep nulls as blank */
  private static String normalizeUrl(String url) {
    if (isBlank(url)) return "";
    return url.trim().replaceAll("/+$", "");
  }
}
