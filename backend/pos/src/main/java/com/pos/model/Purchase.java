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

@Document(collection = "purchases")
@CompoundIndexes({
    @CompoundIndex(name = "idx_purchases_date_warehouse",    def = "{'date':1,'warehouse':1}"),
    @CompoundIndex(name = "idx_purchases_date_supplierQuery", def = "{'date':1,'supplierQuery':1}")
})
public class Purchase {

    @Id
    private String id;

    /** Business date of the purchase (drives dashboard weekly Purchase bars). */
    @Indexed
    private Date date;

    /** Supplier free-text (searchable); index for quick filters. */
    @Indexed
    private String supplierQuery;

    private String supplierDetails;
    private String warehouse;

    @Indexed
    private String orderNo;          // optional: quick lookup

    private String reference;
    private String dueDateISO;       // keep as-is if UI expects ISO string
    private String taxMode;
    private String discountMode;

    private String paymentTerms;
    private boolean updateStock;
    private String notes;

    /** Totals object; getters are null-safe (see below). */
    private Totals totals = new Totals();

    /** Line items; never null for UI binding. */
    private List<Item> items = new ArrayList<>();

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    /* -------------------- nested types -------------------- */
    public static class Totals {
        private BigDecimal subTotal;
        private BigDecimal totalTax;
        private BigDecimal totalDiscount;
        private BigDecimal shipping;
        private BigDecimal grandTotal;

        public BigDecimal getSubTotal()     { return nz(subTotal); }
        public void setSubTotal(BigDecimal v){ this.subTotal = nz(v); }
        public BigDecimal getTotalTax()     { return nz(totalTax); }
        public void setTotalTax(BigDecimal v){ this.totalTax = nz(v); }
        public BigDecimal getTotalDiscount(){ return nz(totalDiscount); }
        public void setTotalDiscount(BigDecimal v){ this.totalDiscount = nz(v); }
        public BigDecimal getShipping()     { return nz(shipping); }
        public void setShipping(BigDecimal v){ this.shipping = nz(v); }

        /** CRITICAL for dashboard: summed for KPI + weekly Purchase bar. */
        public BigDecimal getGrandTotal()   { return nz(grandTotal); }
        public void setGrandTotal(BigDecimal v){ this.grandTotal = nz(v); }

        private static BigDecimal nz(BigDecimal v){ return v == null ? BigDecimal.ZERO : v; }
    }

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

        public BigDecimal getQty()      { return nz(qty); }
        public void setQty(BigDecimal v){ this.qty = nz(v); }

        public BigDecimal getRate()     { return nz(rate); }
        public void setRate(BigDecimal v){ this.rate = nz(v); }

        public BigDecimal getTaxPct()   { return nz(taxPct); }
        public void setTaxPct(BigDecimal v){ this.taxPct = nz(v); }

        public BigDecimal getDiscount() { return nz(discount); }
        public void setDiscount(BigDecimal v){ this.discount = nz(v); }

        private static BigDecimal nz(BigDecimal v){ return v == null ? BigDecimal.ZERO : v; }
    }

    /* ---------------- getters / setters ---------------- */
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

    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getDueDateISO() { return dueDateISO; }
    public void setDueDateISO(String dueDateISO) { this.dueDateISO = dueDateISO; }

    public String getTaxMode() { return taxMode; }
    public void setTaxMode(String taxMode) { this.taxMode = taxMode; }

    public String getDiscountMode() { return discountMode; }
    public void setDiscountMode(String discountMode) { this.discountMode = discountMode; }

    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }

    public boolean isUpdateStock() { return updateStock; }
    public void setUpdateStock(boolean updateStock) { this.updateStock = updateStock; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Totals getTotals() { return totals == null ? (totals = new Totals()) : totals; }
    public void setTotals(Totals totals) { this.totals = (totals == null ? new Totals() : totals); }

    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = (items == null ? new ArrayList<>() : items); }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
}
