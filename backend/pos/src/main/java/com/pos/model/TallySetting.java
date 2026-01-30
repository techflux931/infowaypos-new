// src/main/java/com/pos/model/TallySetting.java
package com.pos.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("tally_settings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TallySetting {
  @Id private String id;

  private boolean enabled;                 // master switch
  private String url;                      // e.g. http://127.0.0.1:9000
  private String company;                  // exact Tally company name

  // default ledgers in Tally
  private String cashLedger;               // "Cash"
  private String bankLedger;               // e.g. "HBL - 1234"
  private String salesLedger;              // "Sales Accounts"
  private String purchaseLedger;           // "Purchase Accounts"
  private String vatOutLedger;             // "Output VAT @5%"
  private String vatInLedger;              // "Input VAT @5%"
  private String roundingLedger;           // "Rounding Off"

  // auto post toggles
  private boolean autoPostSales;           // on save
  private boolean autoPostPurchase;
  private boolean autoPostReceipt;
  private boolean autoPostPayment;
  private boolean autoPostExpense;
}
