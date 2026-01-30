package com.pos.model;

import java.math.BigDecimal;

/** Embedded line item for a POS Sale (Mongo). */
public class SaleItem {

    private String productId;
    private String productCode; // optional: barcode/sku
    private String name;        // EN
    private String nameAr;      // AR
    private String unit;        // e.g. PCS, KG

    /** quantity */
    private BigDecimal qty = BigDecimal.ZERO;

    /** unit price (ex-VAT if you store VAT separately) */
    private BigDecimal unitPrice = BigDecimal.ZERO;

    /** VAT percent (e.g. 5) */
    private BigDecimal vatPercent = BigDecimal.ZERO;

    /** line amount EX-VAT (qty * unitPrice). May be null in legacy data. */
    private BigDecimal amount = BigDecimal.ZERO;

    /** VAT amount for this line */
    private BigDecimal vat = BigDecimal.ZERO;

    /* --------------- getters / setters (null-safe) --------------- */

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameAr() { return nameAr; }
    public void setNameAr(String nameAr) { this.nameAr = nameAr; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getQty() { return nz(qty); }
    public void setQty(BigDecimal qty) { this.qty = nz(qty); }

    public BigDecimal getUnitPrice() { return nz(unitPrice); }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = nz(unitPrice); }

    public BigDecimal getVatPercent() { return nz(vatPercent); }
    public void setVatPercent(BigDecimal vatPercent) { this.vatPercent = nz(vatPercent); }

    /** If amount is missing, fall back to qty * unitPrice (EX-VAT). */
    public BigDecimal getAmount() {
        if (amount == null || amount.signum() == 0) {
            return getQty().multiply(getUnitPrice());
        }
        return amount;
    }
    public void setAmount(BigDecimal amount) { this.amount = nz(amount); }

    public BigDecimal getVat() { return nz(vat); }
    public void setVat(BigDecimal vat) { this.vat = nz(vat); }

    /* ------------ convenience for dashboards / reports ------------ */

    /** Revenue for this line (qty × unitPrice). */
    public BigDecimal getRevenue() {
        return getQty().multiply(getUnitPrice());
    }

    /* ---- Optional legacy aliases (compatibility with older JSON) ---- */
    public double getQuantity() { return getQty().doubleValue(); }
    public void setQuantity(double quantity) { this.qty = BigDecimal.valueOf(quantity); }

    public double getPrice() { return getUnitPrice().doubleValue(); }
    public void setPrice(double price) { this.unitPrice = BigDecimal.valueOf(price); }

    /* ------------------------ helpers ------------------------ */
    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
