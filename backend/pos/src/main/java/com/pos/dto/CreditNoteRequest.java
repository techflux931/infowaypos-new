// src/main/java/com/pos/dto/CreditNoteRequest.java
package com.pos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CreditNoteRequest {

    // ---- Party ----
    private String customerId;

    @NotBlank(message = "customerName is required")
    private String customerName;

    // ---- Header ----
    @JsonAlias({"cnNumber"})
    private String creditNoteNo;

    @JsonAlias({"reference"})
    private String referenceNo;

    @NotNull(message = "creditNoteDate is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonAlias({"date"})
    private LocalDate creditNoteDate;

    private String salesperson;
    private String subject;

    // ---- Lines ----
    @NotNull(message = "items cannot be null")
    private List<Item> items = new ArrayList<>();

    // ---- Totals (optional; service recomputes anyway) ----
    private BigDecimal subTotal;     // optional
    private BigDecimal total;        // optional

    // ---- Legacy/compat (optional) ----
    private String invoiceId;
    private BigDecimal amount;

    // ---- Optional status from UI (Draft | Open | Void). Defaulting handled in service. ----
    private String status;

    // ========= Nested DTO for lines =========
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Item {
        /** Legacy single field. Can be "EN" or "EN | AR". */
        private String item;

        /** New bilingual fields. */
        private String itemEn;
        private String itemAr;

        private String account;
        private BigDecimal quantity;   // qty
        private BigDecimal rate;       // unit price
        private BigDecimal discount;   // % 0..100
        private BigDecimal amount;     // optional from UI; service recomputes

        // --- helpers ---
        private static boolean hasText(String s){ return s != null && !s.trim().isEmpty(); }

        /** Accept legacy "item" and auto-split into itemEn/itemAr when possible. */
        public void setItem(String item) {
            this.item = item;
            if (!hasText(item)) return;

            // Only populate itemEn/itemAr if they aren't already provided
            if (!hasText(this.itemEn) && !hasText(this.itemAr)) {
                String[] parts = item.split("\\|", 2);
                String en = parts.length > 0 ? parts[0].trim() : "";
                String ar = parts.length > 1 ? parts[1].trim() : "";
                if (hasText(en)) this.itemEn = en;
                if (hasText(ar)) this.itemAr = ar;
            }
        }

        /** Return legacy "item" if present; else join EN/AR so downstream code keeps working. */
        public String getItem() {
            if (hasText(this.item)) return this.item;
            String en = this.itemEn == null ? "" : this.itemEn.trim();
            String ar = this.itemAr == null ? "" : this.itemAr.trim();
            if (!hasText(en) && !hasText(ar)) return null;
            if (!hasText(en)) return ar;
            if (!hasText(ar)) return en;
            return en + " | " + ar;
        }

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

    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = (items == null ? new ArrayList<>() : items); }

    public BigDecimal getSubTotal() { return subTotal; }
    public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getInvoiceId() { return invoiceId; }
    public void setInvoiceId(String invoiceId) { this.invoiceId = invoiceId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
