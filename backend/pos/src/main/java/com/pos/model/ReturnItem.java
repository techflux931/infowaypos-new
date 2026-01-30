// src/main/java/com/pos/model/ReturnItem.java
package com.pos.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnItem {
  private String productId;
  private String productCode;
  private String name;
  private String nameAr;
  private String unit;
  private double qty;
  private double unitPrice;
  private double vat;            // per unit VAT
  private double amount;         // price * qty
  private double vatAmount;      // vat * qty
}
