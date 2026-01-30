// src/main/java/com/pos/model/HoldInvoice.java
package com.pos.model;

import java.time.Instant;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "hold_invoices")
public class HoldInvoice {
    @Id
    private String id;
    private Instant date;        // stored as UTC
    private String serialNo;

    private CustomerMini customer;   // optional
    private List<HoldItem> items;

    private double subTotal;
    private double tax;
    private double netAmount;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CustomerMini {
        private String id;
        private String name;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class HoldItem {
        private String barcode;
        private String code;
        private String name;
        private String nameAr;
        private String unit;
        private double qty;
        private double price;
        private double tax;
        private double total;
    }
}
