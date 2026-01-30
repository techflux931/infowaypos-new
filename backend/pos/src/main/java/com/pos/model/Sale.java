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

/** POS bill persisted for the cashier "View Sales" screen and dashboard KPIs. */
@Document(collection = "sales")
@CompoundIndexes({
    // helpful for date-range + cashier or paymentType queries
    @CompoundIndex(name = "idx_sales_date_cashier", def = "{'date':1,'cashier':1}"),
    @CompoundIndex(name = "idx_sales_date_payment", def = "{'date':1,'paymentType':1}")
})
public class Sale {

    @Id
    private String id;

    /** Human-readable invoice number (search key). */
    @Indexed   // keep non-unique; legacy data may have duplicates
    private String invoiceNo;

    /** Business date/time of the sale (used in charts) */
    @Indexed
    private Date date;

    @Indexed private String shift;        // "A" | "B"
    @Indexed private String cashier;      // username/id

    @Indexed private String customerId;
    @Indexed private String customerName;

    /** RETAIL | WHOLESALE | CREDIT */
    @Indexed
    private String saleType;

    /** Totals (safe non-null defaults) */
    private BigDecimal grossTotal   = BigDecimal.ZERO;  // before discount/VAT
    private BigDecimal discount     = BigDecimal.ZERO;  // discount amount
    private BigDecimal vat          = BigDecimal.ZERO;  // VAT amount
    private BigDecimal netTotal     = BigDecimal.ZERO;  // final bill total

    /** CASH | CARD | CREDIT */
    @Indexed
    private String paymentType;

    /** How much received today against this bill (for KPI: todayReceivedSales) */
    private BigDecimal amountReceived = BigDecimal.ZERO;   // NEW (important for dashboard)

    /** Returns (if netted back to the bill) */
    private BigDecimal returnAmount  = BigDecimal.ZERO;

    /** Line items (embedded) */
    private List<SaleItem> items = new ArrayList<>();

    @CreatedDate      private Date createdAt;
    @LastModifiedDate private Date updatedAt;

    /* ---------------- getters/setters ---------------- */
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getInvoiceNo() { return invoiceNo; }
    public void setInvoiceNo(String invoiceNo) { this.invoiceNo = invoiceNo; }

    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }

    public String getShift() { return shift; }
    public void setShift(String shift) { this.shift = shift; }

    public String getCashier() { return cashier; }
    public void setCashier(String cashier) { this.cashier = cashier; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getSaleType() { return saleType; }
    public void setSaleType(String saleType) { this.saleType = saleType; }

    public BigDecimal getGrossTotal() { return nvl(grossTotal); }
    public void setGrossTotal(BigDecimal v) { this.grossTotal = n(v); }

    public BigDecimal getDiscount() { return nvl(discount); }
    public void setDiscount(BigDecimal v) { this.discount = n(v); }

    public BigDecimal getVat() { return nvl(vat); }
    public void setVat(BigDecimal v) { this.vat = n(v); }

    public BigDecimal getNetTotal() { return nvl(netTotal); }
    public void setNetTotal(BigDecimal v) { this.netTotal = n(v); }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public BigDecimal getAmountReceived() { return nvl(amountReceived); }
    public void setAmountReceived(BigDecimal v) { this.amountReceived = n(v); }

    public BigDecimal getReturnAmount() { return nvl(returnAmount); }
    public void setReturnAmount(BigDecimal v) { this.returnAmount = n(v); }

    public List<SaleItem> getItems() { return items; }
    public void setItems(List<SaleItem> items) { this.items = items == null ? new ArrayList<>() : items; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    /* ---- helpers to avoid nulls in math ---- */
    private static BigDecimal n(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private static BigDecimal nvl(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
