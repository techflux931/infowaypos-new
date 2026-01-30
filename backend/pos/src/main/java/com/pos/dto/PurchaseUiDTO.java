package com.pos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class PurchaseUiDTO {
    public String supplierQuery;
    public String supplierDetails;
    public String warehouse;

    public String orderNo;
    public String reference;
    public LocalDate orderDate;
    public LocalDate dueDate;
    public String taxMode;
    public String discountMode;
    public String notes;

    public List<Item> items;
    public Totals totals;

    public String paymentTerms;   // we store into purchase.paymentMethod
    public Boolean updateStock;

    public static class Item {
        public String nameOrCode;
        public BigDecimal qty;
        public BigDecimal rate;
        public BigDecimal taxPct;
        public BigDecimal discount;
        public BigDecimal lineAmount;
        public String note;
    }

    public static class Totals {
        public BigDecimal subTotal;
        public BigDecimal totalTax;
        public BigDecimal totalDiscount;
        public BigDecimal shipping;
        public BigDecimal grandTotal;
    }
}
