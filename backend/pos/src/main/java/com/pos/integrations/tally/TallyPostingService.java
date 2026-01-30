// src/main/java/com/pos/integrations/tally/TallyPostingService.java
package com.pos.integrations.tally;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pos.model.TallySetting;
import com.pos.model.TallySyncLog;
import com.pos.repository.TallySyncLogRepository;
import com.pos.service.TallySettingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TallyPostingService {

  private final TallyClient client;
  private final TallySettingService settingsSvc;
  private final TallySyncLogRepository logs;

  /* ----------------------- Public API ----------------------- */

  /** Sales (POS) – posts a Sales voucher. */
  public String postSales(String vNo, LocalDate date, String partyLedger, boolean cashSale,
                          double sub, double vat, double rounding) {

    TallySetting s = settingsSvc.get();

    // where the money goes (cash drawer or the customer)
    String receiptLedger = cashSale ? s.getCashLedger() : partyLedger;

    double total = sub + vat + rounding; // must equal Dr side

    List<TallyXmlBuilder.Line> lines = new ArrayList<>();
    add(lines, receiptLedger, /*Dr*/ true,  total);
    add(lines, s.getSalesLedger(),          /*Cr*/ false, sub);
    add(lines, s.getVatOutLedger(),         /*Cr*/ false, vat);

    // Rounding: negative -> expense (Dr), positive -> income (Cr)
    if (rounding != 0d) {
      add(lines, s.getRoundingLedger(), /*Dr if negative*/ rounding < 0, Math.abs(rounding));
    }

    // For pure cash sale, do not set a party ledger (keeps Tally happy if no debtor master)
    String party = cashSale ? null : emptyToNull(partyLedger);

    return postVoucher("SALES", "Sales", vNo, date, party, "POS Sales " + vNo, lines);
  }

  /** Purchase – posts a Purchase voucher. */
  public String postPurchase(String vNo, LocalDate date, String vendorLedger, boolean cashPurchase,
                             double sub, double vat, double rounding) {

    TallySetting s = settingsSvc.get();

    String payment = cashPurchase ? s.getCashLedger() : vendorLedger;
    double total = sub + vat + rounding; // must equal Cr side

    List<TallyXmlBuilder.Line> lines = new ArrayList<>();
    add(lines, s.getPurchaseLedger(), /*Dr*/ true,  sub);
    add(lines, s.getVatInLedger(),    /*Dr*/ true,  vat);

    // Rounding: positive -> additional cost (Dr), negative -> income (Cr)
    if (rounding != 0d) {
      add(lines, s.getRoundingLedger(), /*Dr if positive*/ rounding > 0, Math.abs(rounding));
    }

    add(lines, payment,                /*Cr*/ false, total);

    String party = cashPurchase ? null : emptyToNull(vendorLedger);

    return postVoucher("PURCHASE", "Purchase", vNo, date, party, "POS Purchase " + vNo, lines);
  }

  /** Receipt from customer – posts a Receipt voucher. */
  public String postReceipt(String vNo, LocalDate date, String customerLedger, boolean toBank,
                            double amount, String narration) {
    TallySetting s = settingsSvc.get();
    String to = toBank ? s.getBankLedger() : s.getCashLedger();

    List<TallyXmlBuilder.Line> lines = List.of(
        new TallyXmlBuilder.Line(to,             /*Dr*/ true,  p(amount)),
        new TallyXmlBuilder.Line(customerLedger, /*Cr*/ false, p(amount))
    );

    return postVoucher("RECEIPT", "Receipt", vNo, date, emptyToNull(customerLedger), narration, lines);
  }

  /** Payment to vendor – posts a Payment voucher. */
  public String postPaymentToVendor(String vNo, LocalDate date, String vendorLedger, boolean fromBank,
                                    double amount, String narration) {
    TallySetting s = settingsSvc.get();
    String from = fromBank ? s.getBankLedger() : s.getCashLedger();

    List<TallyXmlBuilder.Line> lines = List.of(
        new TallyXmlBuilder.Line(vendorLedger, /*Dr*/ true,  p(amount)),
        new TallyXmlBuilder.Line(from,         /*Cr*/ false, p(amount))
    );

    return postVoucher("PAYMENT", "Payment", vNo, date, emptyToNull(vendorLedger), narration, lines);
  }

  /** Expense paid in cash/bank – posts a Payment voucher (Dr expense, Cr cash/bank). */
  public String postExpensePaid(String vNo, LocalDate date, String expenseLedger, boolean fromBank,
                                double amount, String narration) {
    TallySetting s = settingsSvc.get();
    String from = fromBank ? s.getBankLedger() : s.getCashLedger();

    List<TallyXmlBuilder.Line> lines = List.of(
        new TallyXmlBuilder.Line(expenseLedger, /*Dr*/ true,  p(amount)),
        new TallyXmlBuilder.Line(from,          /*Cr*/ false, p(amount))
    );

    // docType "EXPENSE" is just our label; voucher type remains "Payment"
    return postVoucher("EXPENSE", "Payment", vNo, date, null, narration, lines);
  }

  /* ----------------------- Internals ----------------------- */

  private String postVoucher(String docType, String tallyVchType, String vNo, LocalDate date,
                             String party, String narration, List<TallyXmlBuilder.Line> lines) {

    // build voucher XML (your TallyXmlBuilder should ignore null/blank party)
    String xml = TallyXmlBuilder.voucher(tallyVchType, vNo, date, party, narration, lines);

    TallySyncLog log = TallySyncLog.builder()
        .kind(TallySyncLog.Kind.VOUCHER)
        .docType(docType)
        .voucherNo(vNo)
        .status(TallySyncLog.Status.PENDING)
        .attempts(0)
        .requestXml(xml)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();
    log = logs.save(log);

    try {
      String resp = client.pushVouchers(xml);
      log.setStatus(TallySyncLog.Status.SUCCESS);
      log.setResponseText(resp);
      return resp;
    } catch (Exception ex) {
      log.setStatus(TallySyncLog.Status.FAILED);
      log.setErrorText(ex.getMessage());
      throw ex;
    } finally {
      log.setAttempts(log.getAttempts() + 1);
      log.setUpdatedAt(LocalDateTime.now());
      logs.save(log);
    }
  }

  /** Add a line only if ledger is non-blank and amount != 0, and force +ve amount. */
  private static void add(List<TallyXmlBuilder.Line> lines, String ledger, boolean debit, double amount) {
    if (ledger == null || ledger.isBlank()) return;
    double a = p(amount);
    if (a == 0d) return;
    lines.add(new TallyXmlBuilder.Line(ledger.trim(), debit, a));
  }

  /** Ensure amounts are positive (Tally expects the sign via Dr/Cr, not negative values). */
  private static double p(double v) { return Math.abs(v); }

  private static String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s.trim(); }
}
