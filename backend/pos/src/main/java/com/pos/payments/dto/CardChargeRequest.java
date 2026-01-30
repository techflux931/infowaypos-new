// src/main/java/com/pos/payments/dto/CardChargeRequest.java
package com.pos.payments.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CardChargeRequest(
        @NotNull @Min(1) BigDecimal amount,     // in AED
        @NotBlank String currency,              // "AED"
        String invoiceId,                       // optional: link to Sale/Invoice
        String customerName,                    // optional: for receipt
        String reference,                       // optional: your POS reference
        List<Line> items                        // optional: capture items for Sale
) {
    public record Line(
            @NotBlank String name,
            @NotNull @Min(1) BigDecimal qty,
            @NotNull @Min(0) BigDecimal price
    ) {}
}
