// src/main/java/com/pos/integrations/tally/TallyMasterService.java
package com.pos.integrations.tally;

import java.time.LocalDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.pos.model.AccountGroup;
import com.pos.model.AccountNature;
import com.pos.model.BalanceType;
import com.pos.model.Ledger;
import com.pos.model.TallySyncLog;
import com.pos.repository.AccountGroupRepository;
import com.pos.repository.LedgerRepository;
import com.pos.repository.TallySyncLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TallyMasterService {
  private static final Logger log = LoggerFactory.getLogger(TallyMasterService.class);

  private final TallyClient client;
  private final AccountGroupRepository groups;
  private final LedgerRepository ledgers;
  private final TallySyncLogRepository logs;

  /** Push one Ledger master to Tally and persist a sync log entry. */
  public String pushLedger(String ledgerId) {
    Ledger l = ledgers.findById(ledgerId)
        .orElseThrow(() -> new IllegalArgumentException("Ledger not found: " + ledgerId));

    // -- Safe values ----------------------------------------------------------
    String name   = safe(l.getName(), "Ledger-" + l.getId());
    String parent = resolveParent(l);
    double opening = Math.abs(Optional.ofNullable(l.getOpeningBalance()).orElse(0d));
    if (l.getType() == BalanceType.CREDIT) opening = -opening; // CREDIT => negative

    String requestXml = TallyXmlBuilder.ledger(name, parent, opening, l.isCostCenterApplicable());

    // -- Log attempt ----------------------------------------------------------
    TallySyncLog entry = TallySyncLog.builder()
        .kind(TallySyncLog.Kind.MASTER)
        .docType("LEDGER")
        .docId(l.getId())
        .status(TallySyncLog.Status.PENDING)
        .attempts(0)
        .requestXml(requestXml)
        .createdAt(LocalDateTime.now())
        .updatedAt(LocalDateTime.now())
        .build();
    entry = logs.save(entry);

    // -- Call Tally -----------------------------------------------------------
    try {
      String resp = client.pushMasters(requestXml);
      entry.setStatus(TallySyncLog.Status.SUCCESS);
      entry.setResponseText(resp);
      return resp;
    } catch (Exception ex) {
      entry.setStatus(TallySyncLog.Status.FAILED);
      entry.setErrorText(ex.getMessage());
      log.warn("Tally push failed for ledger {} ({}): {}", l.getId(), name, ex.getMessage());
      throw ex;
    } finally {
      entry.setAttempts(entry.getAttempts() + 1);
      entry.setUpdatedAt(LocalDateTime.now());
      logs.save(entry);
    }
  }

  /** Map our account nature to a valid Tally parent that always exists. */
  private String resolveParent(Ledger l) {
    String gid = l.getGroupId();
    AccountGroup g = (gid == null || gid.isBlank()) ? null : groups.findById(gid).orElse(null);
    AccountNature nature = (g == null || g.getNature() == null) ? AccountNature.ASSET : g.getNature();

    return switch (nature) {
      case ASSET     -> "Sundry Debtors";
      case LIABILITY -> "Sundry Creditors";
      case INCOME    -> "Sales Accounts";
      case EXPENSE   -> (g != null && g.isAffectGrossProfit()) ? "Direct Expenses" : "Indirect Expenses";
      default        -> "Sundry Debtors";
    };
  }

  private static String safe(String v, String fb) {
    return (v == null || v.isBlank()) ? fb : v.trim();
  }
}
