package com.pos.model;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "holds")
public class Hold {

    @Id
    private String id;

    private Date date;              // hold date/time
    private String cashier;
    private String customerId;
    private String customerName;

    private BigDecimal grossTotal;
    private BigDecimal discount;
    private BigDecimal vat;
    private BigDecimal netTotal;

    private List<SaleItem> items;   // items in this hold

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date updatedAt;

    /* ----------------- Getters & Setters ----------------- */

    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }

    public Date getDate() {
        return date;
    }
    public void setDate(Date date) {
        this.date = date;
    }

    public String getCashier() {
        return cashier;
    }
    public void setCashier(String cashier) {
        this.cashier = cashier;
    }

    public String getCustomerId() {
        return customerId;
    }
    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public BigDecimal getGrossTotal() {
        return grossTotal;
    }
    public void setGrossTotal(BigDecimal grossTotal) {
        this.grossTotal = grossTotal;
    }

    public BigDecimal getDiscount() {
        return discount;
    }
    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getVat() {
        return vat;
    }
    public void setVat(BigDecimal vat) {
        this.vat = vat;
    }

    public BigDecimal getNetTotal() {
        return netTotal;
    }
    public void setNetTotal(BigDecimal netTotal) {
        this.netTotal = netTotal;
    }

    public List<SaleItem> getItems() {
        return items;
    }
    public void setItems(List<SaleItem> items) {
        this.items = items;
    }

    public Date getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }
    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }
}
