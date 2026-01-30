package com.pos.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/** Vendor return for a purchase (drives dashboard Purchase Returns KPI). */
@Document(collection = "purchase_returns")
@CompoundIndexes({
    @CompoundIndex(name = "idx_purchasereturns_date_supplier", def = "{'date':1,'supplierQuery':1}"),
    @CompoundIndex(name = "idx_purchasereturns_date_warehouse", def = "{'date':1,'warehouse':1}")
})
public class PurchaseReturn {

    @Id
    private String id;

    /** The day/time the return was processed. */
    @Indexed
    private Date date;

    /** Supplier search/name (mirrors Purchase.supplierQuery). */
    @Indexed
    private String supplierQuery;

    private String supplierDetails;

    @Indexed
    private String warehouse;

    /** Optional identifiers. */
    @Indexed private String returnNo;             // PR-xxxxx
    @Indexed private String originalOrderNo;      // Purchase.orderNo or reference

    private String reason;

    /** Totals (safe defaults; dashboard sums grandTotal). */
    private BigDecimal subTotal      = BigDecimal.ZERO;
    private BigDecimal totalTax      = BigDecimal.ZERO;
    private BigDecimal totalDiscount = BigDecimal.ZERO;
    private BigDecimal shipping      = BigDecimal.ZERO;
    private BigDecimal grandTotal    = BigDecimal.ZERO;

    /** Items returned (vendor-facing). */
    private List<Item> items = new ArrayList<>();

    @CreatedDate      private Date createdAt;
    @LastModifiedDate private Date updatedAt;

    /* ---------------- nested item ---------------- */
    public static class Item {
        private String nameEn;
        private String nameAr;
        private String description;
        private BigDecimal qty;
        private BigDecimal rate;
        private BigDecimal taxPct;
        private BigDecimal discount;

        public String getNameEn() { return nameEn; }
        public void setNameEn(String v) { this.nameEn = v; }
        public String getNameAr() { return nameAr; }
        public void setNameAr(String v) { this.nameAr = v; }
        public String getDescription() { return description; }
        public void setDescription(String v) { this.description = v; }

        public BigDecimal getQty() { return nz(qty); }
        public void setQty(BigDecimal v) { this.qty = nz(v); }

        public BigDecimal getRate() { return nz(rate); }
        public void setRate(BigDecimal v) { this.rate = nz(v); }

        public BigDecimal getTaxPct() { return nz(taxPct); }
        public void setTaxPct(BigDecimal v) { this.taxPct = nz(v); }

        public BigDecimal getDiscount() { return nz(discount); }
        public void setDiscount(BigDecimal v) { this.discount = nz(v); }

        private static BigDecimal nz(BigDecimal v){ return v == null ? BigDecimal.ZERO : v; }
    }

    /* --------------- getters / setters --------------- */
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }

    public String getSupplierQuery() { return supplierQuery; }
    public void setSupplierQuery(String supplierQuery) { this.supplierQuery = supplierQuery; }

    public String getSupplierDetails() { return supplierDetails; }
    public void setSupplierDetails(String supplierDetails) { this.supplierDetails = supplierDetails; }

    public String getWarehouse() { return warehouse; }
    public void setWarehouse(String warehouse) { this.warehouse = warehouse; }

    public String getReturnNo() { return returnNo; }
    public void setReturnNo(String returnNo) { this.returnNo = returnNo; }

    public String getOriginalOrderNo() { return originalOrderNo; }
    public void setOriginalOrderNo(String originalOrderNo) { this.originalOrderNo = originalOrderNo; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public BigDecimal getSubTotal() { return nz(subTotal); }
    public void setSubTotal(BigDecimal v) { this.subTotal = nz(v); }

    public BigDecimal getTotalTax() { return nz(totalTax); }
    public void setTotalTax(BigDecimal v) { this.totalTax = nz(v); }

    public BigDecimal getTotalDiscount() { return nz(totalDiscount); }
    public void setTotalDiscount(BigDecimal v) { this.totalDiscount = nz(v); }

    public BigDecimal getShipping() { return nz(shipping); }
    public void setShipping(BigDecimal v) { this.shipping = nz(v); }

    /** Used by dashboard KPI for Purchase Returns sum. */
    public BigDecimal getGrandTotal() { return nz(grandTotal); }
    public void setGrandTotal(BigDecimal v) { this.grandTotal = nz(v); }

    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = (items == null ? new ArrayList<>() : items); }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    /* ---------------- helpers ---------------- */
    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
