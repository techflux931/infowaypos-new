// src/main/java/com/pos/dto/GroupRow.java
package com.pos.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class GroupRow {

  /* ====== Account Group row (used by AccountGroupService.toRow) ====== */
  private String id;
  private String name;
  private String underAccountId;
  private String underAccountName;
  private String nature;              // "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE"
  private boolean affectGrossProfit;
  private String remarks;

  // ✅ EXACT signature your service uses:
  public GroupRow(String id,
                  String name,
                  String underAccountId,
                  String underAccountName,
                  String nature,
                  boolean affectGrossProfit,
                  String remarks) {
    this.id = id;
    this.name = name;
    this.underAccountId = underAccountId;
    this.underAccountName = underAccountName;
    this.nature = nature;
    this.affectGrossProfit = affectGrossProfit;
    this.remarks = remarks;
  }

  /* ====== Ledger group summary (used elsewhere) ====== */
  private String groupId;
  private long   ledgerCount;
  private double totalOpeningDebit;
  private double totalOpeningCredit;

  // summary constructor (still available)
  public GroupRow(String groupId, long ledgerCount, double totalOpeningDebit, double totalOpeningCredit) {
    this.groupId = groupId;
    this.ledgerCount = ledgerCount;
    this.totalOpeningDebit = totalOpeningDebit;
    this.totalOpeningCredit = totalOpeningCredit;
  }
}
