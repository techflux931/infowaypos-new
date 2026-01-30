// src/main/java/com/pos/model/TallySyncLog.java
package com.pos.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("tally_sync_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TallySyncLog {
  @Id private String id;

  public enum Kind { MASTER, VOUCHER }
  public enum Status { PENDING, SUCCESS, FAILED }

  private Kind kind;
  private String docType;                 // LEDGER/CUSTOMER/VENDOR/SALES/PURCHASE/RECEIPT/PAYMENT/EXPENSE/JOURNAL
  @Indexed private String docId;          // POS id
  private String voucherNo;               // for vouchers
  private Status status;
  private int attempts;

  private String requestXml;
  private String responseText;
  private String errorText;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
