// src/main/java/com/pos/model/CreditNoteLine.java
package com.pos.model;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * A single credit-note line with simple tax.
 * lineTotal = qty * price
 * taxAmount = lineTotal * (taxRate / 100)
 * All monetary values are normalized to scale(2) HALF_UP.
 */
public class CreditNoteLine implements Serializable {

    private static final long serialVersionUID = 1L;

    // ---- constants / helpers ----
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int SCALE_MONEY = 2;
    private static final RoundingMode RM = RoundingMode.HALF_UP;

    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private static BigDecimal s2(BigDecimal v) { return nz(v).setScale(SCALE_MONEY, RM); }

    // ---- data ----
    private String itemId;
    private String itemName;

    // inputs
    private BigDecimal qty     = BigDecimal.ZERO;   // e.g. 2
    private BigDecimal price   = BigDecimal.ZERO;   // unit price
    private BigDecimal taxRate = BigDecimal.ZERO;   // % e.g. 5

    // derived
    private BigDecimal lineTotal = BigDecimal.ZERO; // qty * price
    private BigDecimal taxAmount = BigDecimal.ZERO; // lineTotal * taxRate/100

    /** Recompute {@code lineTotal} and {@code taxAmount} from qty/price/taxRate. */
    public void computeDerived() {
        BigDecimal q  = nz(qty);
        BigDecimal p  = nz(price);
        BigDecimal tr = nz(taxRate);

        BigDecimal lt = q.multiply(p);                         // raw line total
        this.lineTotal = s2(lt);                               // money scale(2)

        // compute tax using a slightly higher intermediate precision, then normalize
        BigDecimal rawTax = lt.multiply(tr).divide(HUNDRED, SCALE_MONEY + 2, RM);
        this.taxAmount = s2(rawTax);
    }

    // ---- getters & setters ----

    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public BigDecimal getQty() { return qty; }
    public void setQty(BigDecimal qty) { this.qty = nz(qty); }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = nz(price); }

    public BigDecimal getTaxRate() { return taxRate; }
    public void setTaxRate(BigDecimal taxRate) { this.taxRate = nz(taxRate); }

    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = s2(lineTotal); }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = s2(taxAmount); }
}
