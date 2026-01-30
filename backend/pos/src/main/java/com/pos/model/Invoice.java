package com.pos.model;

import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Invoice header + items stored in MongoDB.
 */
@Document(collection = "invoices")
public class Invoice {

    @Id
    private String id;

    /** Quick lookup by invoice number (e.g., "INV-258"). */
    @Indexed
    private String invoiceNo;

    /** Optional link back to recurring template. */
    @Indexed
    private String templateId;

    /** Invoice date (used for date-range filters). */
    @Indexed
    private Date date;

    /** Used by "customer" filter. */
    @Indexed
    private String customerName;

    private String customerPhone;

    /** CASH / CARD / CREDIT. */
    @Indexed
    private String paymentType;

    /** Grand total INCLUDING VAT. */
    private double netTotal;

    /** Total VAT amount for this invoice. */
    private double vat;

    /** Bilingual invoice items. */
    private List<InvoiceItem> items;

    // ===== UAE E-INVOICE (FTA) FIELDS =====

    /** Seller / shop name used in QR (can mirror company name). */
    private String sellerName;

    /** TRN (Tax Registration Number) for FTA QR. */
    private String trn;

    /**
     * Base64 TLV e-invoice QR payload
     * (tags: 1=Seller, 2=TRN, 3=Timestamp, 4=Total, 5=VAT).
     */
    private String eInvoiceQr;

    // ===== Audit fields =====

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    // ----------------- Getters / Setters -----------------

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInvoiceNo() {
        return invoiceNo;
    }

    public void setInvoiceNo(String invoiceNo) {
        this.invoiceNo = invoiceNo;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public Date getDate() {
        return date == null ? null : new Date(date.getTime());
    }

    public void setDate(Date date) {
        this.date = (date == null) ? null : new Date(date.getTime());
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public double getNetTotal() {
        return netTotal;
    }

    public void setNetTotal(double netTotal) {
        this.netTotal = round2(netTotal);
    }

    public double getVat() {
        return vat;
    }

    public void setVat(double vat) {
        this.vat = round2(vat);
    }

    public List<InvoiceItem> getItems() {
        return items;
    }

    public void setItems(List<InvoiceItem> items) {
        this.items = items;
    }

    // ---- UAE E-INVOICE fields ----

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public String getTrn() {
        return trn;
    }

    public void setTrn(String trn) {
        this.trn = trn;
    }

    public String getEInvoiceQr() {
        return eInvoiceQr;
    }

    public void setEInvoiceQr(String eInvoiceQr) {
        this.eInvoiceQr = eInvoiceQr;
    }

    // ---- Audit ----

    public Date getCreatedAt() {
        return createdAt == null ? null : new Date(createdAt.getTime());
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = (createdAt == null) ? null : new Date(createdAt.getTime());
    }

    public Date getUpdatedAt() {
        return updatedAt == null ? null : new Date(updatedAt.getTime());
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = (updatedAt == null) ? null : new Date(updatedAt.getTime());
    }

    // ----------------- Helper -----------------

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
