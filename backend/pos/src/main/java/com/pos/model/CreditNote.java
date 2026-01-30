package com.pos.model;


import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "credit_notes")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CreditNote implements Serializable {

    @Id private String id;

    // --- Party ---
    private String customerId;
    private String customerName;

    // --- Header ---
    private String creditNoteNo;
    private String referenceNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate creditNoteDate;

    private String salesperson;
    private String subject;

    // --- Lines ---
    private List<LineItem> items = new ArrayList<>();

    // --- Totals ---
    private BigDecimal subTotal = BigDecimal.ZERO;
    private BigDecimal total    = BigDecimal.ZERO;

    // --- Legacy/compat ---
    private String invoiceId;
    private BigDecimal amount = BigDecimal.ZERO;

    // --- Status & audit ---
    private String status = "Draft";
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ===== Helpers =====
    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private static BigDecimal scale2(BigDecimal v) { return nz(v).setScale(2, RoundingMode.HALF_UP); }

    public void computeTotals() {
        if (items == null) items = new ArrayList<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (LineItem li : items) {
            if (li == null) continue;
            li.computeAmount();
            sum = sum.add(nz(li.getAmount()));
        }
        this.subTotal = scale2(sum);
        this.total    = scale2(sum);
        this.amount   = this.total;
    }

    @JsonProperty("cnNumber")
    public String getCnNumber() { return creditNoteNo; }

    @JsonProperty("date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    public LocalDate getDateAlias() { return creditNoteDate; }

    // ===== Nested Line =====
    public static class LineItem implements Serializable {
        // NEW: bilingual fields (stored in Mongo)
        private String itemEn;
        private String itemAr;

        private String account;
        private BigDecimal quantity;
        private BigDecimal rate;
        private BigDecimal discount;
        private BigDecimal amount;

        private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
        private static BigDecimal scale2(BigDecimal v) { return nz(v).setScale(2, RoundingMode.HALF_UP); }

        public void computeAmount() {
            BigDecimal line = nz(quantity).multiply(nz(rate));
            BigDecimal disc = nz(discount);
            if (disc.signum() > 0) {
                BigDecimal factor = BigDecimal.ONE.subtract(disc.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
                line = line.multiply(factor);
            }
            this.amount = scale2(line);
        }

        // ---- Legacy alias so old clients can POST "item": "EN | AR"
        @JsonProperty(value = "item", access = JsonProperty.Access.WRITE_ONLY)
        public void setItemLegacy(String v) {
            if (v == null) { this.itemEn = null; this.itemAr = null; return; }
            String[] parts = v.split("\\|", 2);
            this.itemEn = parts.length > 0 ? parts[0].trim() : "";
            this.itemAr = parts.length > 1 ? parts[1].trim() : "";
        }

        // If you also want to SHOW "item" in responses, remove WRITE_ONLY and uncomment:
//        @Transient
//        @JsonProperty("item")
//        public String getItemLegacy() {
//            String en = itemEn == null ? "" : itemEn.trim();
//            String ar = itemAr == null ? "" : itemAr.trim();
//            if (en.isEmpty()) return ar;
//            if (ar.isEmpty()) return en;
//            return en + " | " + ar;
//        }

        // getters/setters
        public String getItemEn() { return itemEn; }
        public void setItemEn(String itemEn) { this.itemEn = itemEn; }
        public String getItemAr() { return itemAr; }
        public void setItemAr(String itemAr) { this.itemAr = itemAr; }
        public String getAccount() { return account; }
        public void setAccount(String account) { this.account = account; }
        public BigDecimal getQuantity() { return quantity; }
        public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
        public BigDecimal getRate() { return rate; }
        public void setRate(BigDecimal rate) { this.rate = rate; }
        public BigDecimal getDiscount() { return discount; }
        public void setDiscount(BigDecimal discount) { this.discount = discount; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }


    // ========= Getters/Setters =========
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCreditNoteNo() { return creditNoteNo; }
    public void setCreditNoteNo(String creditNoteNo) { this.creditNoteNo = creditNoteNo; }

    public String getReferenceNo() { return referenceNo; }
    public void setReferenceNo(String referenceNo) { this.referenceNo = referenceNo; }

    public LocalDate getCreditNoteDate() { return creditNoteDate; }
    public void setCreditNoteDate(LocalDate creditNoteDate) { this.creditNoteDate = creditNoteDate; }

    public String getSalesperson() { return salesperson; }
    public void setSalesperson(String salesperson) { this.salesperson = salesperson; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public List<LineItem> getItems() { return items; }
    public void setItems(List<LineItem> items) { this.items = items; }

    public BigDecimal getSubTotal() { return subTotal; }
    public void setSubTotal(BigDecimal subTotal) { this.subTotal = scale2(subTotal); }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { 
        this.total = scale2(total); 
        this.amount = this.total; // keep mirror synced
    }

    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { 
        this.amount = scale2(amount); 
        this.total  = this.amount; // mirror back
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
