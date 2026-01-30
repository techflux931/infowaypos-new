package com.pos.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * One line in an invoice.
 * Holds bilingual item name + quantity * price = total.
 */
public class InvoiceItem {

    @JsonAlias({ "nameEn", "name", "englishName", "name_en" })
    private String nameEn;

    @JsonAlias({ "nameAr", "arabicName", "name_ar" })
    private String nameAr;

    @JsonAlias({ "barcode", "itemBarcode", "productCode", "code" })
    private String barcode;     // optional, used for print / debug

    private int quantity;       // quantity (integer is enough for POS)
    private double price;       // unit price
    private double total;       // quantity * price (rounded to 2 decimals)

    // ----------------- Getters / Setters -----------------

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public String getNameAr() {
        return nameAr;
    }

    public void setNameAr(String nameAr) {
        this.nameAr = nameAr;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = Math.max(0, quantity);
        recalc();
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = Math.max(0, price);
        recalc();
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = round2(total);
    }

    // ----------------- Helpers -----------------

    /** Recalculate total from quantity * price. */
    @JsonIgnore
    public void recalc() {
        this.total = round2(this.quantity * this.price);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    // ---- Legacy compatibility for very old code (PDF etc.) ----

    /** @deprecated use getNameEn()/getNameAr() */
    @Deprecated
    @JsonIgnore
    public String getName() {
        return (nameEn != null && !nameEn.isBlank()) ? nameEn : nameAr;
    }

    /** @deprecated use setNameEn() */
    @Deprecated
    @JsonIgnore
    public void setName(String v) {
        this.nameEn = v;
    }
}
