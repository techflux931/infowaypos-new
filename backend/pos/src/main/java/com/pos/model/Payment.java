// src/main/java/com/pos/model/Payment.java
package com.pos.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * MongoDB document representing a Payment transaction.
 * Used in the "payments" collection.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    /** Business date/time of the payment (UTC). */
    @NotNull
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant date;

    /** Customer display name (used for searching/filtering). */
    @NotBlank
    @Indexed
    private String customerName;

    /** Cash | Card | Bank | Paypal | Manual | Credit ... */
    @NotBlank
    private String paymentType;

    /** Amount paid in invoice currency. */
    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal amount;

    /** POS reference / receipt number / local id. */
    private String reference;

    /** If this payment is tied to an invoice/bill number. */
    private String invoiceId;

    private String notes;

    /* ---- Card/terminal enrichment (optional) ---- */
    private String currency;    // e.g. "AED"
    private String status;      // APPROVED | DECLINED | ERROR
    private String authCode;    // terminal auth code
    private String rrn;         // retrieval reference number
    private String maskedPan;   // e.g. 4111********1111

    /** Audit fields (require @EnableMongoAuditing in your @SpringBootApplication). */
    @CreatedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant createdAt;

    @LastModifiedDate
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Instant updatedAt;
}
