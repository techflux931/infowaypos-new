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

/** Customer return for a sale (drives dashboard Sales Returns KPI). */
@Document(collection = "sale_returns")
@CompoundIndexes({
    @CompoundIndex(name = "idx_salereturns_date_customer", def = "{'date':1,'customerName':1}"),
    @CompoundIndex(name = "idx_salereturns_date_cashier",  def = "{'date':1,'cashier':1}")
})
public class SaleReturn {

    @Id
    private String id;

    /** The day/time the return was processed. */
    @Indexed
    private Date date;

    /** Optional identifiers for tracing. */
    @Indexed private String returnNo;          // SR-xxxxx
    @Indexed private String originalInvoiceNo; // links back to Sale.invoiceNo

    @Indexed private String customerId;
    @Indexed private String customerName;
    @Indexed private String cashier;

    private String reason;

    /** Totals (safe defaults; dashboard sums grandTotal). */
    private BigDecimal subTotal    = BigDecimal.ZERO;
    private BigDecimal totalTax    = BigDecimal.ZERO;
    private BigDecimal totalDiscount = BigDecimal.ZERO;
    private BigDecimal grandTotal  = BigDecimal.ZERO;

    /** Items returned (optional). Reuse SaleItem shape. */
    private List<SaleItem> items = new ArrayList<>();

    @CreatedDate      private Date createdAt;
    @LastModifiedDate private Date updatedAt;

    /* --------------- getters / setters --------------- */
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Date getDate() { return date; }
    public void setDate(Date date) { this.date = date; }

    public String getReturnNo() { return returnNo; }
    public void setReturnNo(String returnNo) { this.returnNo = returnNo; }

    public String getOriginalInvoiceNo() { return originalInvoiceNo; }
    public void setOriginalInvoiceNo(String originalInvoiceNo) { this.originalInvoiceNo = originalInvoiceNo; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCashier() { return cashier; }
    public void setCashier(String cashier) { this.cashier = cashier; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public BigDecimal getSubTotal() { return nz(subTotal); }
    public void setSubTotal(BigDecimal v) { this.subTotal = nz(v); }

    public BigDecimal getTotalTax() { return nz(totalTax); }
    public void setTotalTax(BigDecimal v) { this.totalTax = nz(v); }

    public BigDecimal getTotalDiscount() { return nz(totalDiscount); }
    public void setTotalDiscount(BigDecimal v) { this.totalDiscount = nz(v); }

    /** Used by dashboard KPI for Sales Returns sum. */
    public BigDecimal getGrandTotal() { return nz(grandTotal); }
    public void setGrandTotal(BigDecimal v) { this.grandTotal = nz(v); }

    public List<SaleItem> getItems() { return items; }
    public void setItems(List<SaleItem> items) { this.items = (items == null ? new ArrayList<>() : items); }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    /* ---------------- helpers ---------------- */
    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
